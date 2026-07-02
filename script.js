/* ===================== STATE ===================== */
let currentUser = null;
let darkMode = false;
let pendingImage = { inline:null, modal:null };
const MAX_CHARS = 280;

function avatarUrl(name, size){
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=${size||128}&font-size=0.4&bold=true`;
}

const seedNames = ["Maya Chen","Deshawn Riley","Priya Patel","Tom O'Sullivan","Ines Novak","Marcus Webb"];
const seedHandles = ["mayacodes","deshawnbuilds","priyaux","tom_writes","inesdraws","marcusdev"];

let tweets = [
  {id:5, name:"naledi star", handle:"n_star", time:"3h", text:"Redesigned our onboarding flow this week — 40% fewer drop-offs already. Small UX changes really do compound. #UXDesign #ProductDesign", img:null, likes:212, retweets:34, replies:18, liked:false, retweeted:false, bookmarked:false},
  {id:4, name:"Tom O'Sullivan", handle:"tom_writes", time:"5h", text:"Coffee, cold rain, and a good keyboard. That's the whole vibe today ☕️⌨️", img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=60", likes:1043, retweets:88, replies:64, liked:false, retweeted:false, bookmarked:false},
  {id:3, name:"kazadi Webb", handle:"kaza@dev", time:"7h", text:"Hot take: your side project doesn't need Kubernetes. It needs you to ship it. #WebDev", img:null, likes:876, retweets:201, replies:143, liked:false, retweeted:false, bookmarked:false},
  {id:2, name:"Ines Novak", handle:"inesdraws", time:"9h", text:"Finished a new illustration series about tiny apartments and big dreams 🏙️ swipe through my profile for the rest of the set.", img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=60", likes:534, retweets:47, replies:29, liked:false, retweeted:false, bookmarked:false},
  {id:1, name:"zane low", handle:"zzlow", time:"11h", text:"Spent the weekend building a tiny robot that waters my plants. It's currently 2-0 against my track record of keeping plants alive. 🌱🤖", img:null, likes:389, retweets:52, replies:37, liked:false, retweeted:false, bookmarked:false},
  {id:0, name:"Dr Genius", handle:"dr_code", time:"13h", text:"Reminder: shipping something small today beats planning something huge for next month. #buildinpublic", img:null, likes:678, retweets:112, replies:81, liked:false, retweeted:false, bookmarked:false},
];
let nextId = 100;

const trends = [
  {cat:"Technology · Trending", tag:"#WebDev", meta:"48.2K posts"},
  {cat:"Design · Trending", tag:"#uiDesign", meta:"21.1K posts"},
  {cat:"Trending in your area", tag:"#sillicon valley", meta:"312K posts"},
  {cat:"Music · Trending", tag:"#kanye west", meta:"9,842 posts"},
  {cat:"Trending", tag:"#javascript", meta:"15.4K posts"},
];

const suggestions = [
  {name:"Nova Studio", handle:"novastudio"},
  {name:"Kai Yamamoto", handle:"kaiy"},
  {name:"Ruth Okafor", handle:"ruthbuilds"},
];

const notifications = [
  {icon:"like", text:"Priya Patel and 12 others liked your tweet", time:"2h"},
  {icon:"retweet", text:"Marcus Webb retweeted your tweet", time:"5h"},
  {icon:"follow", text:"Nova Studio followed you", time:"1d"},
];

/* ===================== LOGIN ===================== */
document.getElementById('loginName').addEventListener('input', e=>{
  document.getElementById('loginBtn').disabled = e.target.value.trim().length === 0;
});
document.getElementById('loginName').addEventListener('keydown', e=>{
  if(e.key === 'Enter' && e.target.value.trim().length){ doLogin(); }
});

function slugify(name){
  return name.toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,15) || 'guest';
}

function doLogin(){
  const name = document.getElementById('loginName').value.trim();
  if(!name) return;
  currentUser = { name, handle: slugify(name) };
  enterApp();
}
function doGuest(){
  currentUser = { name:"Guest User", handle:"guest"+Math.floor(Math.random()*9999) };
  enterApp();
}

function enterApp(){
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  const av = avatarUrl(currentUser.name, 128);
  document.getElementById('sidebarAvatar').src = av;
  document.getElementById('sidebarName').textContent = currentUser.name;
  document.getElementById('sidebarHandle').textContent = '@'+currentUser.handle;
  document.getElementById('composerAvatarInline').src = av;
  document.getElementById('composerAvatarModal').src = av;
  document.getElementById('profileAvatar').src = av;
  document.getElementById('profileName').textContent = currentUser.name;
  document.getElementById('profileHandle').textContent = '@'+currentUser.handle;
  document.getElementById('profileHeaderName').textContent = currentUser.name;
  renderFeed();
  renderTrends();
  renderFollowSuggestions();
  renderNotifications();
  renderExplore();
}

/* ===================== NAVIGATION ===================== */
function switchView(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+view).classList.add('active');
  document.querySelectorAll('.nav-item, .bottom-nav a').forEach(n=>{
    n.classList.toggle('active', n.dataset.view === view);
  });
  if(view === 'profile') renderProfileTweets();
  if(view === 'bookmarks') renderBookmarks();
  window.scrollTo({top:0});
}

function switchFeed(feed){
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.feed===feed));
  renderFeed(feed);
}

/* ===================== RENDER TWEETS ===================== */
function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
function formatText(text){
  return escapeHtml(text).replace(/#(\w+)/g,'<span class="hashtag">#$1</span>');
}

function tweetHtml(t){
  return `
  <article class="tweet" data-id="${t.id}" onclick="if(event.target.closest('.action')||event.target.closest('.tweet-menu'))return; void(0)">
    <img class="avatar" width="48" height="48" src="${avatarUrl(t.name,96)}">
    <div class="tweet-body">
      <div class="tweet-head">
        <span class="name">${escapeHtml(t.name)}</span>
        <span class="handle">@${t.handle}</span>
        <span class="dot">·</span>
        <span class="time">${t.time}</span>
        <button class="tweet-menu" onclick="event.stopPropagation()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
        </button>
      </div>
      <div class="tweet-text">${formatText(t.text)}</div>
      ${t.img ? `<img class="tweet-img" src="${t.img}">` : ''}
      <div class="tweet-actions">
        <button class="action reply" onclick="event.stopPropagation();bumpReply(${t.id})">
          <svg viewBox="0 0 24 24"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" fill="currentColor" stroke="none"/></svg>
          <span>${t.replies}</span>
        </button>
        <button class="action retweet ${t.retweeted?'active':''}" onclick="event.stopPropagation();toggleRetweet(${t.id})">
          <svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.35 4.35-1.41 1.41L5.5 7.71V16c0 1.1.9 2 2 2H15v2H7.5c-2.21 0-4-1.79-4-4V7.71L1.56 9.64.15 8.23 4.5 3.88zM19.5 20.12l-4.35-4.35 1.41-1.41 1.94 1.93V8c0-1.1-.9-2-2-2H9v-2h7.5c2.21 0 4 1.79 4 4v8.29l1.94-1.93 1.41 1.41-4.35 4.35z" fill="none" stroke="none" style="fill:currentColor"/></svg>
          <span>${t.retweets}</span>
        </button>
        <button class="action like ${t.liked?'active':''}" onclick="event.stopPropagation();toggleLike(${t.id})">
          <svg viewBox="0 0 24 24"><path d="M12 21s-6.7-4.35-9.33-8.2C.9 10.02 1.6 6.5 4.6 5.1c2.2-1.02 4.6-.1 5.9 1.75L12 8.4l1.5-1.55c1.3-1.85 3.7-2.77 5.9-1.75 3 1.4 3.7 4.92 1.93 7.7C18.7 16.65 12 21 12 21z" fill="none" stroke="none" style="fill:currentColor"/></svg>
          <span>${t.likes}</span>
        </button>
        <button class="action bookmark ${t.bookmarked?'active':''}" onclick="event.stopPropagation();toggleBookmark(${t.id})">
          <svg viewBox="0 0 24 24"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z" fill="none" stroke="none" style="fill:currentColor"/></svg>
        </button>
        <button class="action share" onclick="event.stopPropagation();shareTweet(${t.id})">
          <svg viewBox="0 0 24 24"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.29 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h13c.27 0 .5-.22.5-.5L19 15h2z" fill="currentColor" stroke="none"/></svg>
        </button>
      </div>
    </div>
  </article>`;
}

function renderFeed(feed){
  feed = feed || 'foryou';
  const list = feed === 'following' ? tweets.slice(0,3) : tweets;
  const container = document.getElementById('feedContainer');
  if(list.length === 0){
    container.innerHTML = `<div class="empty-state"><h3>Nothing here yet</h3><p>Tweets will show up here.</p></div>`;
    return;
  }
  container.innerHTML = list.map(tweetHtml).join('');
}

function renderProfileTweets(){
  const mine = tweets.filter(t => t.handle === (currentUser && currentUser.handle));
  document.getElementById('profileHeaderCount').textContent = mine.length + (mine.length===1?' Tweet':' Tweets');
  const el = document.getElementById('profileTweets');
  if(mine.length === 0){
    el.innerHTML = `<div class="empty-state"><h3>No tweets yet</h3><p>When you post, your tweets will show up here.</p></div>`;
  } else {
    el.innerHTML = mine.map(tweetHtml).join('');
  }
}

function renderBookmarks(){
  const saved = tweets.filter(t=>t.bookmarked);
  const el = document.getElementById('bookmarksList');
  if(saved.length===0){
    el.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24"><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"/></svg>
      <h3>Save tweets for later</h3><p>Tap the bookmark icon on any tweet to add it to your Bookmarks — only you can see what you've saved.</p></div>`;
  } else {
    el.innerHTML = saved.map(tweetHtml).join('');
  }
}

function renderNotifications(){
  const icons = {
    like: '<svg viewBox="0 0 24 24" style="fill:var(--like)"><path d="M12 21s-6.7-4.35-9.33-8.2C.9 10.02 1.6 6.5 4.6 5.1c2.2-1.02 4.6-.1 5.9 1.75L12 8.4l1.5-1.55c1.3-1.85 3.7-2.77 5.9-1.75 3 1.4 3.7 4.92 1.93 7.7C18.7 16.65 12 21 12 21z"/></svg>',
    retweet: '<svg viewBox="0 0 24 24" style="fill:var(--retweet)"><path d="M4.5 3.88l4.35 4.35-1.41 1.41L5.5 7.71V16c0 1.1.9 2 2 2H15v2H7.5c-2.21 0-4-1.79-4-4V7.71L1.56 9.64.15 8.23 4.5 3.88zM19.5 20.12l-4.35-4.35 1.41-1.41 1.94 1.93V8c0-1.1-.9-2-2-2H9v-2h7.5c2.21 0 4 1.79 4 4v8.29l1.94-1.93 1.41 1.41-4.35 4.35z"/></svg>',
    follow: '<svg viewBox="0 0 24 24" style="fill:var(--accent)"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/></svg>'
  };
  document.getElementById('notifList').innerHTML = notifications.map(n=>`
    <div class="tweet" style="cursor:default;">
      <div style="width:32px;flex-shrink:0;">${icons[n.icon]}</div>
      <div class="tweet-body">
        <div class="tweet-text" style="margin-top:6px;">${n.text}</div>
        <div style="color:var(--text-secondary);font-size:13px;">${n.time} ago</div>
      </div>
    </div>`).join('');
}

/* ===================== EXPLORE ===================== */
function renderTrends(){
  document.getElementById('trendsPanel').innerHTML = `<h3>Trends for you</h3>` +
    trends.map(t=>`
      <div class="trend" onclick="goExploreTag('${t.tag}')">
        <div class="cat">${t.cat}</div>
        <div class="tag">${t.tag}</div>
        <div class="meta">${t.meta}</div>
      </div>`).join('') + `<a class="show-more" onclick="switchView('explore')">Show more</a>`;
}

function renderFollowSuggestions(){
  document.getElementById('followPanel').innerHTML = `<h3>Who to follow</h3>` +
    suggestions.map((s,i)=>`
      <div class="suggest-row">
        <img class="avatar" width="40" height="40" src="${avatarUrl(s.name,80)}">
        <div class="names">
          <div class="display-name">${s.name}</div>
          <div class="handle">@${s.handle}</div>
        </div>
        <button class="follow-btn" id="follow-${i}" onclick="toggleFollow(${i})">Follow</button>
      </div>`).join('') + `<a class="show-more" onclick="switchView('explore')">Show more</a>`;
}
function toggleFollow(i){
  const btn = document.getElementById('follow-'+i);
  const following = btn.classList.toggle('following');
  btn.textContent = following ? 'Following' : 'Follow';
}

let exploreTagFilter = null;
function goExploreTag(tag){
  exploreTagFilter = tag;
  switchView('explore');
  document.getElementById('exploreSearch').value = tag;
  renderExplore();
}

function renderExplore(){
  const q = document.getElementById('exploreSearch').value.trim().toLowerCase();
  document.getElementById('exploreTrends').innerHTML = q ? '' : `
    <div class="panel" style="border-radius:0;border-left:none;border-right:none;margin-bottom:0;">
      <h3>Trends for you</h3>
      ${trends.map(t=>`
        <div class="trend" onclick="goExploreTag('${t.tag}')">
          <div class="cat">${t.cat}</div>
          <div class="tag">${t.tag}</div>
          <div class="meta">${t.meta}</div>
        </div>`).join('')}
    </div>`;

  if(!q){ document.getElementById('exploreResults').innerHTML = ''; return; }
  const matches = tweets.filter(t =>
    t.text.toLowerCase().includes(q) ||
    t.name.toLowerCase().includes(q) ||
    t.handle.toLowerCase().includes(q)
  );
  const results = document.getElementById('exploreResults');
  if(matches.length === 0){
    results.innerHTML = `<div class="empty-state"><h3>No results for "${escapeHtml(q)}"</h3><p>Try searching for a name, handle or keyword.</p></div>`;
  } else {
    results.innerHTML = matches.map(tweetHtml).join('');
  }
}

/* ===================== COMPOSER ===================== */
function autogrow(el){
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function onComposerInput(el, ctx){
  autogrow(el);
  const len = el.value.length;
  const countEl = document.getElementById(ctx+'CharCount');
  const btn = document.getElementById(ctx+'PostBtn');
  countEl.textContent = len > 0 ? `${len}/${MAX_CHARS}` : '';
  countEl.classList.toggle('warn', len > MAX_CHARS);
  btn.disabled = len === 0 || len > MAX_CHARS;
}

function handleImage(evt, ctx){
  const file = evt.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e=>{
    pendingImage[ctx] = e.target.result;
    document.getElementById(ctx+'ImgPreview').innerHTML = `
      <div class="composer-preview">
        <button class="remove-img" onclick="removeImage('${ctx}')">&times;</button>
        <img src="${e.target.result}">
      </div>`;
    const btn = document.getElementById(ctx+'PostBtn');
    btn.disabled = false;
  };
  reader.readAsDataURL(file);
}
function removeImage(ctx){
  pendingImage[ctx] = null;
  document.getElementById(ctx+'ImgPreview').innerHTML = '';
  const textEl = document.getElementById(ctx+'TweetInput');
  onComposerInput(textEl, ctx);
}

function postTweet(ctx){
  const textEl = document.getElementById(ctx+'TweetInput');
  const text = textEl.value.trim();
  if(!text && !pendingImage[ctx]) return;
  const newTweet = {
    id: nextId++, name: currentUser.name, handle: currentUser.handle, time:"now",
    text: text, img: pendingImage[ctx], likes:0, retweets:0, replies:0,
    liked:false, retweeted:false, bookmarked:false
  };
  tweets.unshift(newTweet);
  textEl.value = '';
  autogrow(textEl);
  pendingImage[ctx] = null;
  document.getElementById(ctx+'ImgPreview').innerHTML = '';
  document.getElementById(ctx+'CharCount').textContent = '';
  document.getElementById(ctx+'PostBtn').disabled = true;
  renderFeed();
  if(ctx==='modal') closeComposer();
  const activeView = document.querySelector('.view.active').id;
  if(activeView === 'view-profile') renderProfileTweets();
}

function openComposer(){
  document.getElementById('composeModal').classList.add('open');
  document.getElementById('modalTweetInput').focus();
}
function closeComposer(){
  document.getElementById('composeModal').classList.remove('open');
}
document.getElementById('composeModal').addEventListener('click', e=>{
  if(e.target.id === 'composeModal') closeComposer();
});
document.addEventListener('keydown', e=>{
  if(e.key === 'Escape') closeComposer();
});

/* ===================== ACTIONS ===================== */
function findTweet(id){ return tweets.find(t=>t.id===id); }

function refreshTweetCard(id){
  document.querySelectorAll(`.tweet[data-id='${id}']`).forEach(card=>{
    card.outerHTML = tweetHtml(findTweet(id));
  });
}

function toggleLike(id){
  const t = findTweet(id);
  t.liked = !t.liked;
  t.likes += t.liked ? 1 : -1;
  refreshTweetCard(id);
  document.querySelectorAll(`.tweet[data-id='${id}'] .action.like`).forEach(b=>{
    b.classList.add('pop');
    setTimeout(()=>b.classList.remove('pop'),300);
  });
}
function toggleRetweet(id){
  const t = findTweet(id);
  t.retweeted = !t.retweeted;
  t.retweets += t.retweeted ? 1 : -1;
  refreshTweetCard(id);
}
function toggleBookmark(id){
  const t = findTweet(id);
  t.bookmarked = !t.bookmarked;
  refreshTweetCard(id);
  if(document.getElementById('view-bookmarks').classList.contains('active')) renderBookmarks();
}
function bumpReply(id){
  const t = findTweet(id);
  t.replies += 1;
  refreshTweetCard(id);
}
function shareTweet(id){
  const btn = event.currentTarget;
  const original = btn.innerHTML;
  btn.innerHTML = '<span style="font-size:12px;">Link copied!</span>';
  setTimeout(()=>{ btn.innerHTML = original; }, 1200);
}

/* ===================== DARK MODE ===================== */
function setDark(on){
  darkMode = on;
  document.documentElement.classList.toggle('dark', on);
  document.getElementById('darkToggle').checked = on;
}
function toggleDarkQuick(){
  setDark(!darkMode);
}
function switchDarkModeFromProfile(){
  switchView('home');
}