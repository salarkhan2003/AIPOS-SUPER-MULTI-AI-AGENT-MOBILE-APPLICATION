import type { BrowserCommand } from '@/types';

export const IRCTC_URL = 'https://www.irctc.co.in/nget/train-search';

export const IRCTC_SELECTORS = {
  username: 'input[formcontrolname="userid"]',
  password: 'input[formcontrolname="password"]',
  searchFrom: 'input[aria-label="Enter From station."]',
  searchTo: 'input[aria-label="Enter To station."]',
};

export function buildInjectScript(): string {
  return `
    (function() {
      window.__ghostDom = function() {
        return document.body ? document.body.innerText.slice(0, 8000) : '';
      };
      window.__ghostExec = function(cmd) {
        try {
          const c = typeof cmd === 'string' ? JSON.parse(cmd) : cmd;
          if (c.action === 'fill' && c.selector) {
            const el = document.querySelector(c.selector);
            if (el) {
              el.focus();
              el.value = c.value || '';
              el.dispatchEvent(new Event('input', { bubbles: true }));
              return JSON.stringify({ ok: true });
            }
            return JSON.stringify({ ok: false, error: 'selector not found' });
          }
          if (c.action === 'click' && c.selector) {
            const el = document.querySelector(c.selector);
            if (el) { el.click(); return JSON.stringify({ ok: true }); }
            return JSON.stringify({ ok: false, error: 'selector not found' });
          }
          if (c.action === 'extract') {
            return JSON.stringify({ ok: true, data: window.__ghostDom() });
          }
          return JSON.stringify({ ok: false, error: 'unknown action' });
        } catch (e) {
          return JSON.stringify({ ok: false, error: String(e) });
        }
      };
      true;
    })();
  `;
}

export function commandToInject(cmd: BrowserCommand): string {
  return `window.__ghostExec(${JSON.stringify(JSON.stringify(cmd))});`;
}

export async function runIrctcLoginFill(
  inject: (js: string) => Promise<string>,
  username: string,
  password: string,
): Promise<{ username: boolean; password: boolean }> {
  const u = await inject(
    commandToInject({ action: 'fill', selector: IRCTC_SELECTORS.username, value: username }),
  );
  const p = await inject(
    commandToInject({ action: 'fill', selector: IRCTC_SELECTORS.password, value: password }),
  );
  return {
    username: u.includes('"ok":true'),
    password: p.includes('"ok":true'),
  };
}
