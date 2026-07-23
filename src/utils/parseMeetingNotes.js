/**
 * 議事録本文をパースして Action Items / Open Questions / Decisions を抽出
 * Genspark AI Meeting Notes 形式を想定
 */

function extractSection(text, sectionName) {
  if (!text) return []

  // セクション開始のパターン（大文字小文字を区別しない）
  const sectionRegex = new RegExp(
    `^#{0,3}\\s*${sectionName}.*?(?=^#{0,3}\\s*[A-Z][A-Za-z\\s]+|$)`,
    'gim'
  )

  const match = text.match(sectionRegex)
  if (!match || !match[0]) return []

  const content = match[0]
  // セクション見出しを削除
  const lines = content
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  return lines
}

/**
 * Action Items を {担当者, 内容, 状態} に分解
 * 形式: "担当者: 内容 (状態)" または "担当者: 内容"
 */
export function parseActionItems(text) {
  const lines = extractSection(text, 'Action Items')

  return lines.map((line) => {
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
