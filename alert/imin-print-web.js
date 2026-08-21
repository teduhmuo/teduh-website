// imin-print-web.js
// Browser-only build of iMin's printer WebSocket SDK, adapted from their
// official uniApp demo (js_sdk/imin-print.js). The original file mixes two
// code paths guarded by uniApp's "#ifdef H5" build-time comments, which only
// get stripped by uniApp's own compiler — in a plain browser both paths
// would try to run, and the non-H5 path calls uni.connectSocket(), which
// doesn't exist here and throws. This version keeps only the browser path.
//
// Talks to the iMinprinterplugin app running locally on the same device via
// ws://127.0.0.1:8081/websocket — this only works when loaded on an iMin
// device with iMinprinterplugin installed; there is nothing to configure,
// it's always localhost.

const PrinterStatusText = {
  '0': 'The printer is normal',
  '3': 'Print head open',
  '7': 'No Paper Feed',
  '8': 'Paper Running Out',
  '99': 'Other errors',
};
function getPrinterStatusText(key) {
  return PrinterStatusText[String(key)] || 'The printer is not connected or powered on';
}

class IminPrinterWeb {
  constructor(address) {
    this.address = address || '127.0.0.1';
    this.port = 8081;
    this.ws = null;
    this.isLock = false;
    this.heart_time = 3000;
    this.check_time = 3000;
    this.lock_time = 4000;
    this.callback = () => {};
  }

  connect() {
    return new Promise((resolve, reject) => {
      const connectTimeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      if (!window.WebSocket) {
        clearTimeout(connectTimeout);
        reject(new Error('Browser does not support WebSocket!'));
        return;
      }

      try {
        const ws = new WebSocket(`ws://${this.address}:${this.port}/websocket`);

        ws.onopen = () => {
          clearTimeout(connectTimeout);
          this.heartCheck();
          resolve(true);
        };
        ws.onclose = () => {
          clearTimeout(connectTimeout);
          this.reconnect();
        };
        ws.onerror = (error) => {
          clearTimeout(connectTimeout);
          reject(error);
        };
        ws.onmessage = (e) => {
          try {
            const parsed = JSON.parse(e.data);
            if (e.data === 'request' || (parsed && parsed.data && parsed.data.text === 'ping')) {
              this.heartCheck();
            } else {
              this.callback(parsed);
            }
          } catch (err) {
            console.error('[imin-printer] Message parse error:', err);
          }
        };

        this.ws = ws;
      } catch (error) {
        clearTimeout(connectTimeout);
        reject(error);
      }
    });
  }

  isConnected() {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  sendParameter(text, type, value, object) {
    return JSON.stringify({
      data: Object.assign(
        {},
        { text: text !== undefined ? text : '', value: value !== undefined ? value : -1 },
        object || {}
      ),
      type: type !== undefined ? type : 0,
    });
  }

  heartCheck() {
    this.h_timer && clearTimeout(this.h_timer);
    this.c_timer && clearTimeout(this.c_timer);
    this.h_timer = setTimeout(() => {
      if (!this.isConnected()) return;
      this.send(this.sendParameter('ping'));
      this.c_timer = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) this.close();
      }, this.check_time);
    }, this.heart_time);
  }

  reconnect() {
    if (this.isLock) return;
    this.isLock = true;
    this.l_timer && clearTimeout(this.l_timer);
    this.l_timer = setTimeout(() => {
      this.connect();
      this.isLock = false;
    }, this.lock_time);
  }

  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    try {
      this.ws.send(message);
      return true;
    } catch (error) {
      console.error('[imin-printer] Send failed:', error);
      return false;
    }
  }

  close() {
    if (this.ws) { this.ws.close(); this.ws = null; }
  }

  // ── Printer commands ────────────────────────────────────────────
  initPrinter(connectType) {
    return this.send(this.sendParameter(connectType || 'USB', 1));
  }

  getPrinterStatus(connectType) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve({ value: -1, text: 'Status check timeout' }), 5000);
      if (!this.isConnected()) { clearTimeout(timeout); resolve({ value: -1, text: 'WebSocket not connected' }); return; }
      this.send(this.sendParameter(connectType || 'USB', 2));
      this.callback = (data) => {
        if (data && data.type === 2) {
          clearTimeout(timeout);
          resolve(Object.assign({}, data.data, { text: getPrinterStatusText(data.data.value) }));
        }
      };
    });
  }

  printAndLineFeed() { this.send(this.sendParameter('', 3)); }
  printAndFeedPaper(height) { this.send(this.sendParameter('', 4, Math.max(0, Math.min(255, height)))); }
  partialCut() { this.send(this.sendParameter('', 5)); }
  setAlignment(alignment) { this.send(this.sendParameter('', 6, Math.max(0, Math.min(2, alignment)))); }
  setTextSize(size) { this.send(this.sendParameter('', 7, size)); }
  setTextTypeface(typeface) { this.send(this.sendParameter('', 8, typeface)); }
  setTextStyle(style) { this.send(this.sendParameter('', 9, Math.max(0, Math.min(3, style)))); }
  setTextLineSpacing(space) { this.send(this.sendParameter('', 10, space)); }
  setTextWidth(width) { this.send(this.sendParameter('', 11, Math.max(0, Math.min(576, width)))); }

  printText(text, type) {
    this.send(this.sendParameter(
      type !== undefined ? text : text + '\n',
      type !== undefined ? 13 : 12,
      type !== undefined ? Math.max(0, Math.min(1, type)) : undefined
    ));
  }

  printColumnsText(colTextArr, colWidthArr, colAlignArr, size, width) {
    this.send(this.sendParameter('', 14, Math.max(0, Math.min(576, width)), {
      colTextArr, colWidthArr,
      colAlign: colAlignArr.map((v) => Math.max(0, Math.min(2, v))),
      size,
    }));
  }
}

IminPrinterWeb.version = '1.0.0-web-adapted';

window.IminPrinterWeb = IminPrinterWeb;
