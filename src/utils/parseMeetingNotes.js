/**
 * 議事録本文をパースして Action Items / Open Questions / Decisions を抽出
 * Markdown見出し（#付き）と素のテキスト見出しの両方に対応
 */

const SECTION_NAMES = [
  'Action Items',
  'Open Questions',
  'Decisions',
  'Other Updates',
  'Key Numbers & Metrics',
]

function extractSection(text, sectionName) {
  if (!text) return []

  const lines = text.split('\n')
  let startIdx = -1

  // セクション開始行を見つける（#の有無に関わらず）
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    // Markdown見出し記号（#）を削除して比較
    const lineWithoutHash = line.replace(/^#{1,6}\s*/, '').trim()
    if (lineWithoutHash === sectionName) {
      startIdx = i
      break
    }
  }

  if (startIdx === -1) return []

  // セクション終了行を見つける（次のセクション見出しまたはテキスト終了）
  let endIdx = lines.length
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    const lineWithoutHash = line.replace(/^#{1,6}\s*/, '').trim()

    // 次のセクション見出しが現れたら終了
    if (SECTION_NAMES.includes(lineWithoutHash)) {
      endIdx = i
      break
    }
  }

  // セクション内容を取得（見出し行を除く）
  const content = lines
    .slice(startIdx + 1, endIdx)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  return content
}

function isIncompleteStatus(status) {
  // 完了を示す語句を含む場合は完了扱い
  const completeKeywords = ['完了', '済', 'Done', '完了済', '完']

  if (!status) return true // 空文字列は未完了

  return !completeKeywords.some((keyword) => status.includes(keyword))
}

/**
 * Action Items を {担当者, 内容, 状態} に分解
 * 形式: "担当者: 内容 (状態)" または "担当者: 内容"
 */
export function parseActionItems(text) {
  const lines = extractSection(text, 'Action Items')

  return lines
    .map((line) => {
      // Markdown リスト記号を削除
      const cleanLine = line.replace(/^[-*+]\s+/, '')

      // "(状態)" パターンを抽出
      const statusMatch = cleanLine.match(/\(([^)]+)\)$/)
      const status = statusMatch ? statusMatch[1].trim() : ''

      // 状態を削除した本文を取得
      let content = statusMatch
        ? cleanLine.substring(0, cleanLine.lastIndexOf('(')).trim()
        : cleanLine

      // "担当者: 内容" パターンを分解
      const colonIndex = content.indexOf(':')
      let assignee = '担当者未定'
      let description = content

      if (colonIndex > -1) {
        assignee = content.substring(0, colonIndex).trim()
        description = content.substring(colonIndex + 1).trim()
      }

      return {
        assignee,
        description,
        status,
      }
    })
    .filter((action) => isIncompleteStatus(action.status))
}

/**
 * Open Questions を抽出
 */
export function parseOpenQuestions(text) {
  const lines = extractSection(text, 'Open Questions')

  return lines.map((line) => {
    // Markdown リスト記号を削除
    return line.replace(/^[-*+]\s+/, '').trim()
  })
}

/**
 * Decisions を抽出
 */
export function parseDecisions(text) {
  const lines = extractSection(text, 'Decisions')

  return lines.map((line) => {
    // Markdown リスト記号を削除
    return line.replace(/^[-*+]\s+/, '').trim()
  })
}

/**
 * 記録本文をパースして全情報を返す
 */
export function parseMeetingNotes(text) {
  return {
    actionItems: parseActionItems(text),
    openQuestions: parseOpenQuestions(text),
    decisions: parseDecisions(text),
  }
}
