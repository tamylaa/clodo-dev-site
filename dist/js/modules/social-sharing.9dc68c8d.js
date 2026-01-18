export function shareOnTwitter() {
const url = encodeURIComponent(window.location.href);
const pageTitle = document.querySelector('h1')?.textContent || 'Check this out';
const text = encodeURIComponent(`${pageTitle} - ${url}`);
const twitterUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
window.open(twitterUrl, '_blank', 'width=600,height=400');
}
export function shareOnLinkedIn() {
const url = encodeURIComponent(window.location.href);
const title = encodeURIComponent(document.title);
const summary = encodeURIComponent(
document.querySelector('meta[name="description"]')?.getAttribute('content') || 
'Check this out'
);
const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`;
window.open(linkedinUrl, '_blank', 'width=600,height=600');
}
export function copyLink() {
const url = window.location.href;
navigator.clipboard.writeText(url).then(() => {
showCopyFeedback();
}).catch(err => {
console.error('Failed to copy link:', err);
const textArea = document.createElement('textarea');
textArea.value = url;
document.body.appendChild(textArea);
textArea.select();
document.execCommand('copy');
document.body.removeChild(textArea);
showCopyFeedback();
});
}
function showCopyFeedback() {
const copyBtn = document.querySelector('.copy-link');
if (copyBtn) {
const originalText = copyBtn.innerHTML;
copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Copied!';
copyBtn.classList.add('copied');
setTimeout(() => {
copyBtn.innerHTML = originalText;
copyBtn.classList.remove('copied');
}, 2000);
}
}
export function initSocialSharing() {
window.shareOnTwitter = shareOnTwitter;
window.shareOnLinkedIn = shareOnLinkedIn;
window.copyLink = copyLink;
}