let cos;
let cosCredentialExpiredTime = 0;
const updateCosCredential = (data) => {
  cos = new COS({
    getAuthorization: function (options, callback) {
      callback({
        TmpSecretId: data.credentials.tmpSecretId,
        TmpSecretKey: data.credentials.tmpSecretKey,
        SecurityToken: data.credentials.sessionToken,
        StartTime: data.startTime,
        ExpiredTime: data.expiredTime,
      });
    }
  });
  cosCredentialExpiredTime = data.expiredTime;
};
const [, username, room] = window.location.pathname.split('/', 3);
const EmojiMap = new Map([['[OK]', 'ok'], ['[赞]', 'thumbsup'], ['[谢谢]', 'thanks'], ['[加油]', 'fighting'], ['[比心]', 'fingerheart'], ['[鼓掌]', 'applaud'], ['[碰拳]', 'fistbump'], ['[+1]', 'plus'], ['[完成]', 'done'], ['[微笑]', 'smile'], ['[呲牙]', 'grin'], ['[大笑]', 'laugh'], ['[奸笑]', 'smirk'], ['[笑哭]', 'lol'], ['[捂脸]', 'facepalm'], ['[送心]', 'love'], ['[可爱]', 'wink'], ['[得意]', 'proud'], ['[灵光一闪]', 'witty'], ['[机智]', 'smart'], ['[惊呆]', 'scowl'], ['[思考]', 'thinking'], ['[流泪]', 'sob'], ['[泣不成声]', 'cry'], ['[黑线]', 'errr'], ['[抠鼻]', 'nosepick'], ['[酷拽]', 'haughty'], ['[打脸]', 'slap'], ['[吐血]', 'spitblood'], ['[衰]', 'toasted'], ['[黑脸]', 'blackface'], ['[看]', 'glance'], ['[呆无辜]', 'dull'], ['[玫瑰]', 'rose'], ['[爱心]', 'heart'], ['[撒花]', 'party'], ['[无辜笑]', 'innocentsmile'], ['[害羞]', 'shy'], ['[偷笑]', 'chuckle'], ['[笑]', 'joyful'], ['[惊喜]', 'wow'], ['[憨笑]', 'trick'], ['[耶]', 'yeah'], ['[我想静静]', 'enough'], ['[泪奔]', 'tears'], ['[尬笑]', 'embarrassed'], ['[吻]', 'kiss'], ['[飞吻]', 'smooch'], ['[爱慕]', 'drool'], ['[舔屏]', 'obsessed'], ['[钱]', 'money'], ['[做鬼脸]', 'tease'], ['[酷]', 'showoff'], ['[摸头]', 'comfort'], ['[小鼓掌]', 'clap'], ['[强]', 'praise'], ['[奋斗]', 'strive'], ['[脸红]', 'blush'], ['[闭嘴]', 'silent'], ['[再见]', 'wave'], ['[吃瓜群众]', 'eating'], ['[what]', 'what'], ['[皱眉]', 'frown'], ['[凝视]', 'dullstare'], ['[晕]', 'dizzy'], ['[鄙视]', 'lookdown'], ['[大哭]', 'wail'], ['[抓狂]', 'crazy'], ['[可怜]', 'whimper'], ['[求抱抱]', 'hug'], ['[快哭了]', 'blubber'], ['[委屈]', 'wronged'], ['[翻白眼]', 'husky'], ['[嘘]', 'shhh'], ['[撇嘴]', 'smug'], ['[发怒]', 'angry'], ['[敲打]', 'hammer'], ['[震惊]', 'shocked'], ['[恐惧]', 'terror'], ['[石化]', 'petrified'], ['[骷髅]', 'skull'], ['[汗]', 'sweat'], ['[擦汗]', 'speechless'], ['[鼾睡]', 'sleep'], ['[困]', 'drowsy'], ['[哈欠]', 'yawn'], ['[雾霾]', 'sick'], ['[吐]', 'puke'], ['[如花]', 'bigkiss'], ['[绿帽子]', 'betrayed'], ['[听歌]', 'headset'], ['[紫薇别走]', 'donnotgo'], ['[抱拳]', 'salute'], ['[握手]', 'shake'], ['[击掌]', 'highfive'], ['[左上]', 'upperleft'], ['[白眼]', 'slight'], ['[吐舌]', 'tongue'], ['[不看]', 'eyesclosed'], ['[熊吉]', 'bear'], ['[啤酒]', 'lips'], ['[蛋糕]', 'beer'], ['[礼物]', 'cake'], ['[胡瓜]', 'gift'], ['[2021]', 'cucumber'], ['[吐彩虹]', 'rainbowpuke'], ['[伤心]', 'heartbroken'], ['[炸弹]', 'bomb'], ['[屎]', 'poop'], ['[18禁]', '18x'], ['[刀]', 'cleaver']]);
const messageList = document.getElementsByClassName('message-list')[0];
const dynamicStyleActivePerson = document.getElementById('person-style');
const setActivePerson = (person_id) => {
  dynamicStyleActivePerson.innerHTML = `.person_${person_id}{background-color:#cce0ff}`;
};
let current = null;
const persons = new Map();
const fetchMoreRecord = async () => {
  if (current !== null && current <= 0) return;
  const search = new URLSearchParams({ username, room });
  if (current !== null) search.set('current', current);
  if (cosCredentialExpiredTime < new Date().getTime() / 1000 + 60) search.set('credential', 'refresh');
  try {
    const response = await fetch(`/api/record/?${search.toString()}`, { credentials: 'include' });
    const data = await response.json();
    if (current === null) {
      data.persons.forEach(person => persons.set(person.id, { name: person.name, image: person.image }));
      setActivePerson(data.persons[0].id);
      if (!data.credential) {
        cos = { getObjectUrl: (config, callback) => callback(true) };
      }
    }
    if (data.credential) {
      updateCosCredential(data.credential);
    }
    current = data.current;
    return data.data;
  } catch {
    console.error('Network error.');
  }
};
const getDate = (record) => record.time.substr(0, 10);
const fallbackImgUrl = 'https://t8.baidu.com/it/u=600537420,938334136&fm=193';
function imgOnerror(self) {
  if (self.src !== fallbackImgUrl) self.src = fallbackImgUrl;
  else self.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAkCAYAAABIdFAMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAHhJREFUeNo8zjsOxCAMBFB/KEAUFFR0Cbng3nQPw68ArZdAlOZppPFIBhH5EAB8b+Tlt9MYQ6i1BuqFaq1CKSVcxZ2Acs6406KUgpt5/LCKuVgz5BDCSb13ZO99ZOdcZGvt4mJjzMVKqcha68iIePB86GAiOv8CDADlIUQBs7MD3wAAAABJRU5ErkJggg%3D%3D';
}
const renderRecord = (() => {
  const judgeStartEnd = (current, another) => {
    if (!another) return true;
    return current.person_id !== another.person_id || getDate(current) !== getDate(another);
  };
  const replaceLarkEmoji = (text) => {
    const result = [];
    const regExp = /\[[^\]\[]{1,4}]/g;
    let temp;
    let lastIndex = 0;
    while (temp = regExp.exec(text)) {
      const name = temp[0];
      if (EmojiMap.has(name)) {
        const key = EmojiMap.get(name);
        result.push(text.substring(lastIndex, temp.index));
        lastIndex = temp.index + name.length;
        result.push(`<span class="larkw-emoji__wrapper"><img alt="${name}" draggable="false" class="larkw-emoji__img larkw-emoji__img-${key}" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAAXNSR0IArs4c6QAAAVlpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KTMInWQAAACdJREFUSA3t0DEBAAAAwqD1T+1vBohAYcCAAQMGDBgwYMCAAQMGfmAOLgABrSzR1AAAAABJRU5ErkJggg=="></span>`);
      }
    }
    result.push(text.substring(lastIndex));
    return result.join('');
  };
  const replaceHtmlSymbol = (text) => {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  };
  const urlRegex = /(https?:\/\/[^\s\u4e00-\u9fff]+)/g;
  const replaceLinkBr = (text) => {
    return text.replace(/\n/g, '<br/>').replace(urlRegex, match => `<a href="${match}" target="_blank" rel="noreferrer noopener">${match}</a>`);
  };
  let timer = null;
  let lastRecord = null;
  let finished = true;
  return async (init = false) => {
    if (timer || !finished) return;
    finished = false;
    timer = setTimeout(() => timer = null, 200);
    const records = await fetchMoreRecord();
    if (!Array.isArray(records) || records.length === 0) return;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const person = record.person_id !== null ? persons.get(record.person_id) : null;
      const start = judgeStartEnd(record, records[i - 1]);
      const end = judgeStartEnd(record, records[i + 1] || lastRecord);
      const div = document.createElement('div');
      div.className = `message-wrapper${start ? ' start' : ''}${end ? ' end' : ''}`;
      const avatar = start ? `<img class="avatar" alt src="${person.image}"/>` : '';
      const left = `<div class="message-left">${avatar}</div>`;
      const pcTime = !isMobile && start ? `<div class="time">${person.name} ${getDate(record)}</div>` : '';
      const mobileTime = isMobile ? `<div class="time">${getDate(record)}</div>` : '';
      let text = null;
      if (record.type === 0) {
        text = replaceLarkEmoji(replaceLinkBr(replaceHtmlSymbol(record.content)));
      } else if (record.type === 1) {
        const url = await new Promise((resolve) => {
          cos.getObjectUrl({
            Bucket: 'lark-record-img-1255520126',
            Region: 'ap-guangzhou',
            Key: `${username}/${room}/${record.content}`,
            Sign: true,
          }, function (err, data) {
            if (err) {
              resolve(fallbackImgUrl);
              return;
            }
            resolve(data.Url);
          });
        });
        text = `<img alt="[图片]" src="${url}" onerror="imgOnerror(this)"/>`;
      } else if (record.type === -1) {
          text = '此消息已撤回';
      } else if (record.type === -2) {
          text = '此消息已丢失';
      }
      const content = `<div class="content person_${record.person_id}${record.type < 0 ? '  recalled' : ''}${record.type === 1 ? ' image' : ''}">${text}</div>`;
      const right = `<div class="message-right">${pcTime}${content}${mobileTime}</div>`;
      div.innerHTML = `${left}${right}`;
      fragment.appendChild(div);
    }
    lastRecord = records[0];
    const lastFirstChild = messageList.firstChild;
    while (touching) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (window.scrollY === 0 && !init) {
      scrollTo(0, 1);
    }
    messageList.insertBefore(fragment, lastFirstChild);
    if (init) {
      scrollTo(0, 999999);
      await new Promise((resolve) => setTimeout(resolve, 500));
      scrollTo(0, 999999);
    } else {
      while (Math.abs(window.scrollY - lastFirstChild.offsetTop) > 30) {
        // alert('' + window.scrollY + ',  ' + lastFirstChild.offsetTop);
        if (touching) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        } else {
          scrollTo(0, lastFirstChild.offsetTop);
        }
      }
    }
    intersectionObserver.disconnect();
    if (current > 0) intersectionObserver.observe(messageList.firstChild);
    await new Promise(resolve => setTimeout(resolve, 100));
    finished = true;
  }
})();
renderRecord(true);
const intersectionObserver = new IntersectionObserver((entries) => {
  if (entries[0].intersectionRatio <= 0) return;
  renderRecord();
});
let touching = false;
if (isMobile) {
  let lastTimeElementStyle = null;
  document.body.addEventListener('touchstart', e => touching = true);
  document.body.addEventListener('touchend', e => touching = false);
  messageList.addEventListener('click', e => {
    const path = e.composedPath ? e.composedPath() : e.path;
    for (const element of path) {
      if (element.classList.contains('message-wrapper')) {
        const currentElementStyle = element.getElementsByClassName('time')[0].style;
        if (lastTimeElementStyle && !Object.is(currentElementStyle, lastTimeElementStyle)) {
          lastTimeElementStyle.visibility = '';
          lastTimeElementStyle.marginBottom = '-25px';
        }
        if (currentElementStyle.visibility === '') {
          currentElementStyle.visibility = 'initial';
          currentElementStyle.marginBottom = '0';
          lastTimeElementStyle = currentElementStyle;
        } else {
          currentElementStyle.visibility = '';
          currentElementStyle.marginBottom = '-25px';
          lastTimeElementStyle = null;
        }
        break;
      }
    }
  });
}