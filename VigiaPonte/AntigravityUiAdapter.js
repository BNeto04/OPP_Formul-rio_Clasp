/**
 * VigiaPonte/AntigravityUiAdapter.js
 * 
 * Adaptador restrito e auditável de interface gráfica com o Antigravity.
 * 
 * Limites Inegociáveis de Segurança:
 * - allowed_ui_payloads = ['V'] exclusivamente.
 * - clipboard_use = false.
 * - arbitrary_typing = false.
 * - arbitrary_shell = false.
 * - auto_permission_approval = false (se modal de permissão aberto -> fail closed).
 * - conversation_ambiguity_fail_closed = true.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class AntigravityUiAdapter {
  constructor(options = {}) {
    this.allowedPayloads = ['V'];
    this.simulated = options.simulated || false;
    this.customDriver = options.customDriver || null;
    this.authorizedProjectKeywords = options.authorizedProjectKeywords || ['OPP', 'Codex', 'syntheon', 'Formul', 'Correção'];
  }

  /**
   * Valida estritamente se o payload pretendido está na allowlist canônica
   * @param {string} payload
   * @returns {boolean}
   */
  validatePayload(payload) {
    return payload === 'V';
  }

  /**
   * Verifica se o processo Antigravity está em execução
   * @returns {boolean}
   */
  isProcessRunning() {
    if (this.customDriver && typeof this.customDriver.isProcessRunning === 'function') {
      return this.customDriver.isProcessRunning();
    }
    try {
      if (process.platform === 'win32') {
        const out = execSync('tasklist /FI "IMAGENAME eq Antigravity.exe" /NH', {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore']
        });
        return out.toLowerCase().includes('antigravity.exe');
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Inspeciona janelas do Antigravity na estação WinSta0\default
   * @returns {Array<Object>}
   */
  inspectWindows() {
    if (this.customDriver && typeof this.customDriver.inspectWindows === 'function') {
      return this.customDriver.inspectWindows();
    }

    if (this.simulated || process.platform !== 'win32') {
      return [];
    }

    try {
      const psScript = `
        Add-Type @'
          using System;
          using System.Collections.Generic;
          using System.Runtime.InteropServices;
          using System.Text;

          public class WinScanner {
            [DllImport("user32.dll", SetLastError = true)]
            public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

            [DllImport("user32.dll")]
            public static extern bool CloseDesktop(IntPtr hDesktop);

            public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

            [DllImport("user32.dll")]
            public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumWindowsProc lpfn, IntPtr lParam);

            [DllImport("user32.dll")]
            public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

            [DllImport("user32.dll")]
            public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

            [DllImport("user32.dll")]
            public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

            [DllImport("user32.dll")]
            public static extern bool IsWindowVisible(IntPtr hWnd);

            [DllImport("user32.dll")]
            public static extern bool IsIconic(IntPtr hWnd);

            public static List<string> Scan() {
              var list = new List<string>();
              IntPtr hDesk = OpenDesktop("default", 0, false, 0x01FF);
              if (hDesk == IntPtr.Zero) return list;

              EnumDesktopWindows(hDesk, (hWnd, lParam) => {
                uint pid;
                GetWindowThreadProcessId(hWnd, out pid);
                try {
                  var proc = System.Diagnostics.Process.GetProcessById((int)pid);
                  if (proc.ProcessName.IndexOf("antigravity", StringComparison.OrdinalIgnoreCase) >= 0) {
                    var sbT = new StringBuilder(512);
                    GetWindowText(hWnd, sbT, 512);
                    var sbC = new StringBuilder(256);
                    GetClassName(hWnd, sbC, 256);
                    bool vis = IsWindowVisible(hWnd);
                    bool minimized = IsIconic(hWnd);
                    string cls = sbC.ToString();
                    string title = sbT.ToString();
                    if (cls.IndexOf("Chrome_WidgetWin_1", StringComparison.OrdinalIgnoreCase) >= 0 || vis) {
                      list.Add(string.Format("{0}|{1}|{2}|{3}|{4}|{5}", hWnd.ToInt64(), pid, vis, minimized, cls, title));
                    }
                  }
                } catch {}
                return true;
              }, IntPtr.Zero);

              CloseDesktop(hDesk);
              return list;
            }
          }
'@
        [WinScanner]::Scan()
      `;

      const out = execSync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 4000
      });

      const lines = out.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      return lines.map(line => {
        const [hwndStr, pidStr, visStr, minStr, cls, ...titleParts] = line.split('|');
        return {
          hwnd: parseInt(hwndStr, 10),
          pid: parseInt(pidStr, 10),
          visible: visStr === 'True',
          minimized: minStr === 'True',
          className: cls,
          title: titleParts.join('|')
        };
      });
    } catch (e) {
      return [];
    }
  }

  /**
   * Identifica a conversa operacional de forma inequívoca
   * @param {Array<Object>} [windows]
   * @returns {Object} { identified, isAmbiguous, window, reason, method, confidence }
   */
  identifyOperationalConversation(windows = null) {
    const list = windows || this.inspectWindows();
    
    // Janelas candidatas principais (visíveis e da classe Chrome_WidgetWin_1)
    const mainCandidates = list.filter(w => w.visible && w.className.includes('Chrome_WidgetWin_1'));

    if (mainCandidates.length === 0) {
      return {
        identified: false,
        isAmbiguous: false,
        window: null,
        method: 'WINDOW_TITLE_AND_CLASS',
        confidence: 'NONE',
        reason: 'Nenhuma janela gráfica visível do Antigravity encontrada'
      };
    }

    if (mainCandidates.length > 1) {
      // Múltiplas janelas visíveis: verificar se há ambiguidade de títulos
      const matched = mainCandidates.filter(w => 
        this.authorizedProjectKeywords.some(kw => w.title.toLowerCase().includes(kw.toLowerCase()))
      );

      if (matched.length === 1) {
        return {
          identified: true,
          isAmbiguous: false,
          window: matched[0],
          method: 'PROJECT_KEYWORD_MATCH',
          confidence: 'HIGH',
          reason: `Janela única correspondente ao projeto operacional identificada: "${matched[0].title}"`
        };
      }

      // Ambiguidade estrita: mais de uma janela candidata -> FAIL CLOSED
      return {
        identified: false,
        isAmbiguous: true,
        window: null,
        method: 'FAIL_CLOSED',
        confidence: 'NONE',
        reason: `Múltiplas janelas candidatas do Antigravity em execução (${mainCandidates.length} janelas). Ambiguidade detectada; operação abortada com segurança.`
      };
    }

    const singleWin = mainCandidates[0];
    const matchesKeyword = this.authorizedProjectKeywords.some(kw => singleWin.title.toLowerCase().includes(kw.toLowerCase()));

    return {
      identified: true,
      isAmbiguous: false,
      window: singleWin,
      method: matchesKeyword ? 'PROJECT_KEYWORD_MATCH' : 'SINGLE_ACTIVE_WINDOW_MATCH',
      confidence: matchesKeyword ? 'HIGH' : 'MEDIUM',
      reason: `Janela operacional única em foco identificada: "${singleWin.title}"`
    };
  }

  /**
   * Verifica se há modais de segurança ou autorização abertos
   * @param {Array<Object>} [windows]
   * @returns {boolean}
   */
  isModalPresent(windows = null) {
    const list = windows || this.inspectWindows();
    // Modais no Chrome/Electron frequentemente usam Chrome_WidgetWin_2 ou títulos de permissão
    return list.some(w => 
      w.visible && (
        w.className.includes('Chrome_WidgetWin_2') ||
        /permiss[aã]o|autoriza|confirm|security|warning/i.test(w.title)
      )
    );
  }

  /**
   * Avalia a prontidão da GUI para recebimento de comandos
   * @returns {Object}
   */
  evaluateGuiReadiness() {
    if (!this.isProcessRunning()) {
      return {
        ready: false,
        state: 'ANTIGRAVITY_PROCESS_DOWN',
        reason: 'Processo Antigravity não está em execução'
      };
    }

    const windows = this.inspectWindows();
    if (windows.length === 0 || !windows.some(w => w.visible)) {
      return {
        ready: false,
        state: 'ANTIGRAVITY_PROCESS_UP_GUI_NOT_READY',
        reason: 'Processo ativo, mas janela gráfica ainda não está visível'
      };
    }

    if (this.isModalPresent(windows)) {
      return {
        ready: false,
        state: 'ANTIGRAVITY_BLOCKED_OR_WAITING_OWNER',
        reason: 'Modal de permissão/segurança detectado na interface. Auto-aprovação estritamente negada.'
      };
    }

    const conv = this.identifyOperationalConversation(windows);
    if (conv.isAmbiguous) {
      return {
        ready: false,
        state: 'AMBIGUOUS_CONVERSATION',
        reason: conv.reason
      };
    }

    if (!conv.identified) {
      return {
        ready: false,
        state: 'CONVERSATION_NOT_FOUND',
        reason: conv.reason
      };
    }

    return {
      ready: true,
      state: 'ANTIGRAVITY_GUI_READY_IDLE',
      window: conv.window,
      reason: 'Interface pronta e conversa operacional identificada'
    };
  }

  /**
   * Foca a janela da conversa autorizada e envia estritamente o comando canônico 'V'
   * @param {string} payload Deve ser exatamente 'V'
   * @param {Object} [targetWindow] Janela alvo identificada
   * @returns {Promise<Object>}
   */
  async focusAndSendV(payload, targetWindow = null) {
    // 1. Gate absoluto de autorização de payload
    if (!this.validatePayload(payload)) {
      return {
        success: false,
        action: 'REJECTED',
        reason: `Payload "${payload}" não autorizado. Apenas o envio canônico de "V" é permitido.`,
        sentConfirmed: false
      };
    }

    if (this.customDriver && typeof this.customDriver.focusAndSendV === 'function') {
      return this.customDriver.focusAndSendV(payload, targetWindow);
    }

    if (this.simulated || process.platform !== 'win32') {
      return {
        success: true,
        action: 'SEND_V_SIMULATED',
        payload: 'V',
        sentConfirmed: true,
        method: 'SIMULATED_DIRECT_KEYSTROKE',
        clipboardUsed: false
      };
    }

    const win = targetWindow || (this.identifyOperationalConversation().window);
    if (!win || !win.hwnd) {
      return {
        success: false,
        action: 'NO_SEND',
        reason: 'Janela alvo não identificada com precisão',
        sentConfirmed: false
      };
    }

    try {
      // Envio direto via PowerShell e Win32 SendMessage / PostMessage / SendWait sem uso de clipboard
      const psScript = `
        Add-Type @'
          using System;
          using System.Runtime.InteropServices;

          public class NativeInput {
            [DllImport("user32.dll")]
            public static extern bool SetForegroundWindow(IntPtr hWnd);

            [DllImport("user32.dll")]
            public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

            [DllImport("user32.dll")]
            public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

            public const byte VK_V = 0x56;
            public const byte VK_RETURN = 0x0D;
            public const uint KEYEVENTF_KEYUP = 0x0002;

            public static bool FocusAndTypeV(IntPtr hWnd) {
              ShowWindow(hWnd, 9); // SW_RESTORE
              bool fg = SetForegroundWindow(hWnd);
              System.Threading.Thread.Sleep(150);

              // Disparo atômico da tecla V
              keybd_event(VK_V, 0, 0, UIntPtr.Zero);
              System.Threading.Thread.Sleep(50);
              keybd_event(VK_V, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
              System.Threading.Thread.Sleep(100);

              // Disparo do Enter para submissão
              keybd_event(VK_RETURN, 0, 0, UIntPtr.Zero);
              System.Threading.Thread.Sleep(50);
              keybd_event(VK_RETURN, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);

              return true;
            }
          }
'@
        [NativeInput]::FocusAndTypeV([IntPtr]${win.hwnd})
      `;

      execSync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`, {
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 4000
      });

      return {
        success: true,
        action: 'SEND_V',
        payload: 'V',
        sentConfirmed: true,
        targetHwnd: win.hwnd,
        method: 'WIN32_DIRECT_KEYBD_EVENT',
        clipboardUsed: false
      };
    } catch (err) {
      return {
        success: false,
        action: 'SEND_UNCERTAIN',
        reason: `Falha técnica durante disparo de input: ${err.message}. Não repete para evitar duplicidade.`,
        sentConfirmed: false,
        clipboardUsed: false
      };
    }
  }
}

module.exports = AntigravityUiAdapter;
