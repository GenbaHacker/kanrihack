# HANDOFF — KanriHack

> 作業のたびに上書き更新する（追記しない）。Claude Chat / デスクトップ版 Claude との共有用。
> 数値・ID・コマンド出力は生のまま書く。推測は「推測」と明記する。

---

## 0. 現在の状態（2026-11-05）

- リポジトリ: `GenbaHacker/kanrihack`（**PUBLIC**）。本番: https://kanrihack.web.app （Firebase プロジェクト `kanrihack`、Spark）
- 直近コミット: `5cd6802 fix: KH-7-FIX2 — 見出し記号なし形式に対応（実データ準拠）`
- 作業ツリー（このファイル追加前）: `M .firebase/hosting.ZGlzdA.cache` ／ `?? .claude/`（どちらも KH-8 とは無関係。触っていない）

## 1. KH-8 — 会社アカウントへの引き継ぎ ＋ アカウント管理（未着手・疑問点への回答待ち）

指示（Claude Chat、2026-11-05）の要約:

1. 許可（Firebase コンソール・清田の手作業）: `orgs/sawada/config/allowlist` の emails と admins に
   `kiyotayuya@eco-sawada.com` を追加 → 会社アカウントでログインして uid を確認 →
   `orgs/sawada/userProfiles/{新uid}` に `{ isAdmin: true }` を作成
2. 所有者の移行（1回限り・Admin SDK）: `scripts/migrate-owner.mjs` で records の `createdBy == 旧uid` を
   新uid／`createdByEmail=kiyotayuya@eco-sawada.com` に更新。実行前に件数（shared/private 別）→ 清田 GO → 実行 → 件数一致を報告。
   旧uid は allowlist から外さない
3. アカウント管理機能（コード）: 管理者が画面から allowlist（emails/admins）を編集。
   firestore.rules の config/allowlist を「isAdmin() なら emails/admins のみ更新可」、読み取りは isAdmin() のみ。
   MemberManagement に「ユーザー管理」タブ。完了条件: 非管理者が allowlist を書けないことのルールテスト

### 着手前の調査結果（2026-11-05、コード変更なし）

- firestore.rules: `isAdmin()` は `allowlist.admins` で判定。`config/allowlist` は現在 read/write とも false。
  `userProfiles` は本人のみ読み取り・書き込み false。
- 画面の管理者判定は `userProfiles.isAdmin`（src/App.jsx L25-30、KH-5-FIX 以降）。
  → **管理者の判定元が2つ**（ルール＝allowlist.admins／画面＝userProfiles.isAdmin）。
- `createdBy` を使う箇所: InputScreen.jsx L40-41（作成時に createdBy / createdByEmail）、
  Timeline.jsx L40（非公開の取得条件）・L227/284/295/306/335/345（編集可否）、ActionsList.jsx L36。
- Java が入っていない（`java` コマンド無し）→ Firestore エミュレータでのルールテストが今は動かせない。
- `firebase-admin` は未導入。`scripts/` フォルダは無い。

### 清田に確認中の疑問点（回答待ち）

1. ルールテスト用に JDK を入れてよいか（案: `winget install Microsoft.OpenJDK.21`）。本番 Firestore では試さない
2. 管理者トグルは allowlist.admins と userProfiles.isAdmin を **1回の書き込み（batch）で同時更新**し、
   ルールもその2か所だけ管理者に許す案でよいか
3. 自分を管理者から外す／管理者0人になる書き込みはルールで拒否する案でよいか
4. 移行の認証は鍵ファイルを作らず `gcloud auth application-default login`（清田の認証）で Admin SDK を動かす案でよいか（リポジトリが PUBLIC のため）
5. 旧アカウントの uid（kiyota8328@gmail.com と推測）を教えてほしい
6. 移行後、非公開記録は旧アカウントから見えなくなる（会社アカウントで見える）。指示どおりの想定か確認

### 本番への書き込み（それぞれ別に清田の GO が必要）

- 手順2の移行スクリプト実行、firestore.rules の deploy、Hosting の deploy、GitHub への push
