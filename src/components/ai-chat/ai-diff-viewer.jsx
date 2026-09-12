import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import styles from './ai-diff-viewer.css';

/**
 * Line-by-line Diff algorithm based on Dynamic Programming (LCS)
 */
export function computeLineDiff (oldText = '', newText = '') {
    const oldLines = oldText ? oldText.split('\n') : [];
    const newLines = newText ? newText.split('\n') : [];

    if (oldLines.length === 0) {
        return {
            diffs: newLines.map((line, idx) => ({
                type: 'add',
                newLineNum: idx + 1,
                text: line
            })),
            added: newLines.length,
            deleted: 0
        };
    }

    if (oldText === newText) {
        return {
            diffs: newLines.map((line, idx) => ({
                type: 'same',
                oldLineNum: idx + 1,
                newLineNum: idx + 1,
                text: line
            })),
            added: 0,
            deleted: 0
        };
    }

    const m = oldLines.length;
    const n = newLines.length;

    // DP table: capped to 2000 lines to avoid high memory spikes on huge files
    const maxLines = 1500;
    if (m > maxLines || n > maxLines) {
        return {
            diffs: newLines.map((l, i) => ({ type: 'add', newLineNum: i + 1, text: l })),
            added: newLines.length,
            deleted: oldLines.length
        };
    }

    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (oldLines[i] === newLines[j]) {
                dp[i + 1][j + 1] = dp[i][j] + 1;
            } else {
                dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }
    }

    let i = m;
    let j = n;
    const result = [];
    let added = 0;
    let deleted = 0;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            result.unshift({
                type: 'same',
                oldLineNum: i,
                newLineNum: j,
                text: oldLines[i - 1]
            });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            result.unshift({
                type: 'add',
                newLineNum: j,
                text: newLines[j - 1]
            });
            added++;
            j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            result.unshift({
                type: 'del',
                oldLineNum: i,
                text: oldLines[i - 1]
            });
            deleted++;
            i--;
        }
    }

    return { diffs: result, added, deleted };
}

const AIDiffViewer = ({
    oldCode = '',
    newCode = '',
    targetName = '当前角色',
    status = 'pending', // 'pending' | 'applied' | 'rejected'
    appliedBlockCount = 0,
    onApply,
    onFocusBlocks,
    onDiscard
}) => {
    const [expanded, setExpanded] = useState(true);
    const [viewMode, setViewMode] = useState('diff'); // 'diff' | 'raw'
    const [copied, setCopied] = useState(false);
    const [applying, setApplying] = useState(false);

    const { diffs, added, deleted } = useMemo(() => {
        return computeLineDiff(oldCode, newCode);
    }, [oldCode, newCode]);

    const handleCopy = async e => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(newCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (_) {
            // fallback ignore
        }
    };

    const handleApply = async () => {
        if (!onApply || applying) return;
        setApplying(true);
        try {
            await onApply();
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className={styles.diffCard}>
            {/* Card Header */}
            <div
                className={styles.diffHeader}
                onClick={() => setExpanded(!expanded)}
                style={{ cursor: 'pointer' }}
            >
                <div className={styles.headerLeft}>
                    <span className={styles.targetBadge}>角色: {targetName}</span>
                    <span className={styles.statsBadge}>
                        <span className={styles.statsAdd}>+{added}</span>
                        {deleted > 0 && <span className={styles.statsDel}>-{deleted}</span>}
                    </span>
                </div>
                <div className={styles.headerRight}>
                    <button
                        className={styles.toolBtn}
                        onClick={e => {
                            e.stopPropagation();
                            setViewMode(viewMode === 'diff' ? 'raw' : 'diff');
                        }}
                        title={viewMode === 'diff' ? '查看纯源码' : '查看差异比对'}
                    >
                        {viewMode === 'diff' ? '源码' : '差异'}
                    </button>
                    <button
                        className={styles.toolBtn}
                        onClick={handleCopy}
                        title="复制代码"
                    >
                        {copied ? '✓ 已复制' : '复制'}
                    </button>
                    <button
                        className={styles.toggleBtn}
                        onClick={e => {
                            e.stopPropagation();
                            setExpanded(!expanded);
                        }}
                        title={expanded ? '折叠' : '展开'}
                    >
                        {expanded ? '▲' : '▼'}
                    </button>
                </div>
            </div>

            {/* Diff or Raw Content Body */}
            {expanded && (
                <>
                    {viewMode === 'diff' ? (
                        <div className={styles.diffContainer}>
                            {diffs.map((d, index) => {
                                let lineClass = styles.diffLineSame;
                                let sign = ' ';
                                if (d.type === 'add') {
                                    lineClass = styles.diffLineAdd;
                                    sign = '+';
                                } else if (d.type === 'del') {
                                    lineClass = styles.diffLineDel;
                                    sign = '-';
                                }
                                return (
                                    <div key={index} className={`${styles.diffLine} ${lineClass}`}>
                                        <span className={styles.lineNum}>
                                            {d.type === 'del' ? d.oldLineNum : (d.newLineNum || '')}
                                        </span>
                                        <span className={styles.lineSign}>{sign}</span>
                                        <span className={styles.lineText}>{d.text || ' '}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <pre className={styles.rawCode}>
                            <code>{newCode}</code>
                        </pre>
                    )}

                    {/* Card Footer / Actions */}
                    <div className={styles.diffFooter}>
                        <div className={styles.footerLeft}>
                            {status === 'applied' ? (
                                <span className={styles.statusPillApplied}>
                                    已应用至画布 {appliedBlockCount > 0 ? `(${appliedBlockCount} 个脚本)` : ''}
                                </span>
                            ) : (
                                <span className={styles.statusPillPending}>
                                    待应用变更
                                </span>
                            )}
                        </div>
                        <div className={styles.footerRight}>
                            {status === 'applied' && onFocusBlocks && (
                                <button
                                    className={styles.focusBtn}
                                    onClick={onFocusBlocks}
                                    title="在画布上高亮并发光定位积木"
                                >
                                    定位积木
                                </button>
                            )}
                            {status !== 'applied' && onApply && (
                                <button
                                    className={styles.applyBtn}
                                    onClick={handleApply}
                                    disabled={applying}
                                    title="将变更编译并注入到 TurboWarp 画布"
                                >
                                    {applying ? '正在注入…' : '应用变更 (Apply)'}
                                </button>
                            )}
                            {status !== 'applied' && onDiscard && (
                                <button
                                    className={styles.discardBtn}
                                    onClick={onDiscard}
                                    title="放弃本次代码修改"
                                >
                                    放弃
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

AIDiffViewer.propTypes = {
    oldCode: PropTypes.string,
    newCode: PropTypes.string.isRequired,
    targetName: PropTypes.string,
    status: PropTypes.oneOf(['pending', 'applied', 'rejected']),
    appliedBlockCount: PropTypes.number,
    onApply: PropTypes.func,
    onFocusBlocks: PropTypes.func,
    onDiscard: PropTypes.func
};

export default AIDiffViewer;
