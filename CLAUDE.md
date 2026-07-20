# KanriHack — CLAUDE.md

## このプロジェクトは何か
面談記録アプリ「KanriHack」(GENBA HACKER ブランド)。
面談メンバーを先に選択→録音/ファイル/テキスト投入→Whisper文字起こし→
Claude整形＋タスク抽出→メンバー別タイムラインに時系列追記。
株式会社SAWADAが最初の顧客(orgs/sawada)。将来は外販するSaaS。

## 技術構成（勝手に変えない）
- Vite + React (JavaScript。TypeScript化禁止)
- PWA (manifest: standalone、ダーク+ゴールド系)
- Firebase: Auth(Googleサインイン) / Firestore / Storage / Functions
- 状態管理ライブラリ追加禁止。React標準のみ
- CSSはメディアクエリでレスポンシブ。PC/モバイルのコンポーネント分岐禁止

## 設計の不変条件（違反は差し戻し）
1. **順番の逆転が製品の核心**: 必ず「メンバー選択→入力」。
   入力後にメンバーを推測・マッチングする実装は絶対に作らない
2. **Firestoreパスは orgs/{orgId}/ 配下のみ**。トップレベルコレクション禁止
3. **APIキーをクライアントに置かない**: Whisper/Claude呼び出しはFunctions経由のみ
4. **記録本文と数値メタデータ(quota/原価)はコレクション分離**
5. **可視性は2値** (共有/非公開)。ロール階層を勝手に設計しない
6. **メンバー削除は論理削除**。記録データの物理削除コードを書かない
7. **音声ファイルは文字起こし完了後に削除**する設計を維持

## 作業ルール
- 指示されたタスクIDの範囲のみ実装。リファクタ・改善提案の勝手な実装禁止
- FROZEN / REPORT ONLY と書かれたものに触らない
- データや値が無ければ推測で埋めず「無い」と報告する
- 1タスク=1コミット。コミットメッセージは "feat: KH-N — 内容"
- push後 `git log origin/main..HEAD --oneline` が空であることを貼って完了報告
- self-testはデフォルト値でなく実データで行う
- このフォルダ(kanrihack)の外への読み書き禁止

## 完了の定義
Claude Code の self-test PASS ≠ 完了。
司令官側のブラウザ実機検証が緑になって初めて完了。
