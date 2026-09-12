/**
 * block-highlighter.js — Blockly visual diff, glow pulse and viewport focus
 * for InstanceScratch / TurboWarp Copilot.
 */

import LazyScratchBlocks from '../../lib/tw-lazy-scratch-blocks';

const STYLE_ELEMENT_ID = 'tw-ai-block-glow-styles';

/**
 * Ensure the glow pulse animation CSS is injected into the DOM
 */
function ensureGlowStyles () {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ELEMENT_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ELEMENT_ID;
    style.textContent = `
        @keyframes twAiBlockGlow {
            0% {
                filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.85)) drop-shadow(0 0 14px rgba(124, 77, 255, 0.65));
            }
            50% {
                filter: drop-shadow(0 0 16px rgba(0, 229, 255, 1)) drop-shadow(0 0 32px rgba(124, 77, 255, 0.95));
            }
            100% {
                filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.85)) drop-shadow(0 0 14px rgba(124, 77, 255, 0.65));
            }
        }
        .tw-ai-glow-pulse {
            animation: twAiBlockGlow 1.6s ease-in-out infinite !important;
            transition: filter 0.4s ease;
        }
        .tw-ai-glow-pulse-flash {
            filter: drop-shadow(0 0 20px #00e5ff) !important;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Safely get the active ScratchBlocks workspace
 */
export function getWorkspace () {
    const SB = LazyScratchBlocks.get();
    if (SB && typeof SB.getMainWorkspace === 'function') {
        const ws = SB.getMainWorkspace();
        if (ws) return ws;
    }
    if (typeof window !== 'undefined' && window.Blockly && typeof window.Blockly.getMainWorkspace === 'function') {
        return window.Blockly.getMainWorkspace();
    }
    return null;
}

let activeTimers = [];

/**
 * Highlight a set of blocks in the Blockly workspace with a glowing pulse
 * @param {string[]} blockIds - IDs of blocks to highlight
 * @param {number} durationMs - How long the glow should last (default: 5000ms)
 */
export function highlightBlocks (blockIds = [], durationMs = 5000) {
    ensureGlowStyles();
    const ws = getWorkspace();
    if (!ws || !blockIds || blockIds.length === 0) return;

    // Clear previous timers
    for (const t of activeTimers) clearTimeout(t);
    activeTimers = [];

    const highlightedSvgs = [];

    for (const id of blockIds) {
        try {
            const block = ws.getBlockById(id);
            if (block && typeof block.getSvgRoot === 'function') {
                const svg = block.getSvgRoot();
                if (svg) {
                    svg.classList.add('tw-ai-glow-pulse');
                    highlightedSvgs.push(svg);
                }
            }
        } catch (_) {
            // ignore block lookup errors
        }
    }

    if (highlightedSvgs.length > 0 && durationMs > 0) {
        const timer = setTimeout(() => {
            for (const svg of highlightedSvgs) {
                try {
                    svg.classList.remove('tw-ai-glow-pulse');
                } catch (_) {}
            }
        }, durationMs);
        activeTimers.push(timer);
    }
}

/**
 * Smoothly scroll the Blockly workspace to focus on the given block
 * @param {string} blockId - The block ID to scroll into view
 */
export function focusBlock (blockId) {
    ensureGlowStyles();
    const ws = getWorkspace();
    if (!ws || !blockId) return;

    try {
        const block = ws.getBlockById(blockId);
        if (!block) return;

        const root = (typeof block.getRootBlock === 'function' ? block.getRootBlock() : null) || block;
        const s = typeof ws.getMetrics === 'function' ? ws.getMetrics() : null;
        if (!s) return;

        const pos = root.getRelativeToSurfaceXY ? root.getRelativeToSurfaceXY() : { x: root.x || 0, y: root.y || 0 };
        const scale = ws.scale || 1;

        const x = pos.x * scale;
        const y = pos.y * scale;

        // Center on screen accounting for margins and content offset
        const targetX = x - s.contentLeft - (s.viewWidth / 3);
        const targetY = y - s.contentTop - (s.viewHeight / 3);

        if (ws.scrollbar && typeof ws.scrollbar.set === 'function') {
            ws.scrollbar.set(targetX, targetY);
        }

        // Highlight this specific stack
        const svg = root.getSvgRoot ? root.getSvgRoot() : null;
        if (svg) {
            svg.classList.add('tw-ai-glow-pulse');
            setTimeout(() => {
                svg.classList.remove('tw-ai-glow-pulse');
            }, 4500);
        }
    } catch (e) {
        console.warn('[block-highlighter] focusBlock failed:', e);
    }
}
