// ── Helpers ──────────────────────────────────────────────────────────

function getMetaPixelId(): string | undefined {
  return process.env.META_PIXEL_ID || undefined;
}

function getTiktokPixelId(): string | undefined {
  return process.env.TIKTOK_PIXEL_ID || undefined;
}

// ── Base Pixel Scripts (server-rendered in <head>) ───────────────────

export function PixelScripts() {
  const metaId = getMetaPixelId();
  const tiktokId = getTiktokPixelId();

  return (
    <>
      {metaId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaId}');
fbq('track', 'PageView');
          `.trim(),
          }}
        />
      )}
      {tiktokId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
!function(w,d,t){
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
  ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;
  ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
  var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;
  var c=document.getElementsByTagName("script")[0];c.parentNode.insertBefore(a,c)};
  ttq.load('${tiktokId}');
  ttq.page();
}(window, document, 'ttq');
          `.trim(),
          }}
        />
      )}
    </>
  );
}

// ── Event Tracking Functions (call from client-side code) ────────────

/**
 * Call when a user initiates a scan ("Analyze My Space" clicked).
 */
export function trackScanInitiated() {
  try {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Lead");
    }
    if (typeof window !== "undefined" && (window as any).ttq) {
      (window as any).ttq.track("SubmitForm");
    }
  } catch {
    // Silently ignore — tracking should never break the app
  }
}

/**
 * Call when a user clicks an outbound purchase link.
 * @param productName Human-readable name of the product
 * @param url The destination URL (for the TikTok ClickButton event)
 */
export function trackOutboundClick(productName: string, url: string) {
  try {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "Purchase", {
        content_name: productName,
      });
    }
    if (typeof window !== "undefined" && (window as any).ttq) {
      (window as any).ttq.track("ClickButton", {
        content_name: productName,
        url,
      });
    }
  } catch {
    // Silently ignore — tracking should never break the app
  }
}
