# Changelog

All notable changes to [Kwami](https://github.com/kwami-labs/kwami) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Reconstructed from the full git history (**606** commits, 2025-10-20 → 2026-09-05).

### How to read this file

1. **Current library line** (`2.0.0` rewrite → `2.1.1`) — the published `kwami` package today.
2. **Ecosystem line** (`1.3.0` → `1.5.11`) — monorepo apps (web, candy, market, DAO, Solana).
3. **Early playground line** (`2.0.0` → `2.2.7`) — original Mind/Body/Soul demo (Oct–Nov 2025).

Version numbers were reset when the project evolved; duplicate semvers are annotated with the year.
Merge commits and changelog-only edits are omitted.

---

## [2.1.1](https://github.com/kwami-labs/kwami/commit/effde693a16a6049e05daa7e5b260808a683186c) - 2026-09-05

_Current stable — semantic-release baseline._

### Bug Fixes

- **ci:** sync lockfile and unblock lint/test ([`0f80d21e`](https://github.com/kwami-labs/kwami/commit/0f80d21e22d3895173fccee4228b3d7f73ffbafe))
- **build:** enable semantic-release and attribute package externals fix ([`5715e6cd`](https://github.com/kwami-labs/kwami/commit/5715e6cd94c0f656370569a7f5eb796cae12b383))

### CI

- Switch workflow from npm to pnpm ([`11956410`](https://github.com/kwami-labs/kwami/commit/1195641082edb6e7651b8cd4da8ccf159f8e6adc))
- Expand quality gates, tests, and release automation ([`170cb273`](https://github.com/kwami-labs/kwami/commit/170cb273081e79a5fc58c2ca149182903c3ee8f4))
- Bump GitHub Actions and target Dependabot at dev (#64) ([`bcf51d24`](https://github.com/kwami-labs/kwami/commit/bcf51d24a976c26d754620d96eebe3a6622fa193))
- Resolve stg merge conflicts for promote path ([`7d9259b5`](https://github.com/kwami-labs/kwami/commit/7d9259b59d66788e4e1cf5713f06126410a40eb4))
- Resolve main merge conflicts for promote path ([`0c9d0047`](https://github.com/kwami-labs/kwami/commit/0c9d00472a3b9c36e927c59b2003c4cb2efe1a65))
- Promote main conflict resolution to stg (#69) ([`ee5a4322`](https://github.com/kwami-labs/kwami/commit/ee5a4322dea1a89b06c6c8d0879981e758f808a8))

### Chores

- Default tooling to pnpm (never npm) ([`c89bead8`](https://github.com/kwami-labs/kwami/commit/c89bead8e18c9557b9520a83200c54cdb3c1ffed))

## [2.1.0 (2026)](https://github.com/kwami-labs/kwami/commit/9ca34803147c935decd4d47e9313fba473989d52) - 2026-07-30

_Current library line: pnpm tooling, soul traits, eye-iris, LiveKit browser sessions._

### Features

- Add particles face avatar renderer ([`022df1f4`](https://github.com/kwami-labs/kwami/commit/022df1f4025b86b19d1113f54b2ee75cf7b3f588))
- Improve Blob XYZ renderer and star field scene ([`d24e963c`](https://github.com/kwami-labs/kwami/commit/d24e963c1b96144f5ebd9e9359c5a27c6e77b597))
- Extend Kwami core, agent, and tool registry ([`02499256`](https://github.com/kwami-labs/kwami/commit/0249925631956ba80161159b68260f051cc3d925))
- Add Blob XYZ material skins (fresnel, iridescent, marble) ([`3232dcf4`](https://github.com/kwami-labs/kwami/commit/3232dcf4e9986bf29082f2f31b27c734f58c9842))
- Add Blob XYZ material skins and geometry updates ([`6a9ef8d6`](https://github.com/kwami-labs/kwami/commit/6a9ef8d67f62aeecb9f9cfc2e8a3391ac69458ee))
- Refine Blob XYZ animation and types ([`329ffe7a`](https://github.com/kwami-labs/kwami/commit/329ffe7ae04f5f732fcb0a869c078d2c42a286c9))
- Add voice UI catalog for STT, LLM, TTS, and realtime ([`1d7b5457`](https://github.com/kwami-labs/kwami/commit/1d7b5457050c44537f93351cfc251fc5ed28a10c))
- Add avatar presets and randomizer utilities ([`dd4d48a3`](https://github.com/kwami-labs/kwami/commit/dd4d48a33747fdc7b051d0bac641ebdf36dfbb4e))
- Add soul presets and template helpers ([`943ad47e`](https://github.com/kwami-labs/kwami/commit/943ad47e5ce2c076090c8ea92f7fa4edef5ac13a))
- LiveKit: dedupe transcripts, interim STT, stackable speech callbacks ([`1f12dc12`](https://github.com/kwami-labs/kwami/commit/1f12dc1279b7b47c8d937c5198be3af193b95b06))
- Agent: add memory config sync update type ([`14d8c5ab`](https://github.com/kwami-labs/kwami/commit/14d8c5abde58a80a90af283fae071513c7530077))
- Avatar: add eye-iris renderer and blob cursor-follow controls ([`b89a1db3`](https://github.com/kwami-labs/kwami/commit/b89a1db31528163407921b2d7f36ef5c45f147ca))
- Eye iris: expand renderer behavior and config types ([`34aa9917`](https://github.com/kwami-labs/kwami/commit/34aa99177dd5c986e0015edbf78320271fea164e))
- Eye iris: improve shader realism and scene-control behavior ([`c02f16ed`](https://github.com/kwami-labs/kwami/commit/c02f16edb3c85ca31139a7da6cf7dc7a74a79714))
- LiveKit: handle browser_session data messages for cloud browser UI ([`a184469a`](https://github.com/kwami-labs/kwami/commit/a184469aa3c900f51d21d5eaea5fd758c3628602))
- Eye iris: pointer-driven pupil motion and follow tuning ([`f50dd840`](https://github.com/kwami-labs/kwami/commit/f50dd840e8d75e59707048d96472a1e83b9366d3))
- Soul: expand emotional tones and trait prompt shaping ([`b5c31a2d`](https://github.com/kwami-labs/kwami/commit/b5c31a2d11ad9dab8409e329b90179f024c3c478))
- Soul: add weighted emotional trait influence ([`ffa67fb4`](https://github.com/kwami-labs/kwami/commit/ffa67fb44b00b54910b1ca4987b455781d6552d4))
- Soul: remove configurable trait-weight schema from core types ([`d92ddc05`](https://github.com/kwami-labs/kwami/commit/d92ddc051b1fae6dffda17710cb42d4e58066815))

### Bug Fixes

- Refine blob randomizer and BlobXyz behavior ([`3be3f9ae`](https://github.com/kwami-labs/kwami/commit/3be3f9ae10744ac73ea806fd5366b53af0c9d92d))

### Refactoring

- Refine avatar presets, randomizer, and Blob XYZ types ([`6821ba98`](https://github.com/kwami-labs/kwami/commit/6821ba98a0268c2d770aca452e9006ef60933cde))

### Documentation

- Rename playground UI to app UI in LiveKitAdapter comments ([`73ea19af`](https://github.com/kwami-labs/kwami/commit/73ea19af5df2e7bc21bbe810d4c15c7db2b794a6))
- Use client-agnostic wording in LiveKitAdapter comments ([`819cf230`](https://github.com/kwami-labs/kwami/commit/819cf23040805eaeaa22ce072cea5106ae3b2b06))

### Styling

- Avatar: decouple blob-xyz listening from agent state ([`8f16a139`](https://github.com/kwami-labs/kwami/commit/8f16a13963112785a2780541833a2be1e86ac774))
- Blob shader: tweak poles skin fragment styling ([`df9d343a`](https://github.com/kwami-labs/kwami/commit/df9d343a55b3f0e77708fab4c374a07b9526c430))
- Blob: tweak spiral skin fragment shader ([`46ea4a76`](https://github.com/kwami-labs/kwami/commit/46ea4a76a401b22fd977ae3ef0ecd0dbac6263ae))
- Blob: refine spiral skin fragment shader ([`a8dfe753`](https://github.com/kwami-labs/kwami/commit/a8dfe75325c82310c672a589ccd03ba6163effa5))

### Chores

- Remove Orbital Shards, Stars Genesis and Crystal Ball 3D avatar renderers ([`f58eb540`](https://github.com/kwami-labs/kwami/commit/f58eb540c176704979df051c61aff6401bddc945))
- Update package dependencies ([`8d9e51fd`](https://github.com/kwami-labs/kwami/commit/8d9e51fdf0113434d95cae0fbdb53fc013e5c8bd))
- Export voice catalog, presets, and randomizer from kwami ([`3869fa71`](https://github.com/kwami-labs/kwami/commit/3869fa718b38cf7dc6a211f81979c1676bdf5e2c))
- Bump to v2.1.0 and drop self-referential dependency ([`9ca34803`](https://github.com/kwami-labs/kwami/commit/9ca34803147c935decd4d47e9313fba473989d52))

## [2.0.0 (2026)](https://github.com/kwami-labs/kwami/commit/c8a12a772db5f17dd1bc9d602b40c1ac30957f11) - 2026-03-10

_Current library published as v2.0.0 with pnpm lockfile._

### CI

- Bump the actions group with 2 updates ([`6a3f48e8`](https://github.com/kwami-labs/kwami/commit/6a3f48e8bf293445914436968b23d79110cdbd15))

### Chores

- **deps-dev:** bump @types/node in the typescript-ecosystem group ([`1b92e013`](https://github.com/kwami-labs/kwami/commit/1b92e013c1e472b34f008445645f4d33cdfcda3c))
- **deps:** bump three from 0.170.0 to 0.183.2 in the glsl-tools group ([`f9f45ccd`](https://github.com/kwami-labs/kwami/commit/f9f45ccd16a490a1e9a1376f87699471d615507a))
- **deps-dev:** bump vite from 6.4.1 to 7.3.1 ([`1cf0f3be`](https://github.com/kwami-labs/kwami/commit/1cf0f3bef0ae333ec4f20b60eabdad946f3b90c9))
- **deps-dev:** bump globals from 15.15.0 to 17.4.0 ([`b1df85aa`](https://github.com/kwami-labs/kwami/commit/b1df85aa01ca575e9aabf04ab344163fea040a18))
- **deps-dev:** bump @eslint/js from 9.39.2 to 10.0.1 ([`f45aa303`](https://github.com/kwami-labs/kwami/commit/f45aa303ab5bd1c7e03c870f468c5201cc31f6fe))
- Bump to v2.0.0, switch to pnpm lockfile, update gitignore ([`c8a12a77`](https://github.com/kwami-labs/kwami/commit/c8a12a772db5f17dd1bc9d602b40c1ac30957f11))

## [2.0.0-main](https://github.com/kwami-labs/kwami/commit/b67895b4ea465ec0e6e74dd172eb9f33e89b3989) - 2026-03-09

_Main branch replaced with the rewritten v2 library._

### Features

- Add agent audio stream visualization to avatar ([`f9929e19`](https://github.com/kwami-labs/kwami/commit/f9929e19d5f679d727d7d306ec2e34d2addc002f))
- Enhance agent functionality with dynamic tool execution and memory management updates ([`4ca31c54`](https://github.com/kwami-labs/kwami/commit/4ca31c5426cb9d7b597b9642d163e357ac52074f))
- Add click and right-click callbacks to Blob and Crystal renderers ([`adf74b13`](https://github.com/kwami-labs/kwami/commit/adf74b13effb8227a52104ed2826a9c1cd908df2))
- Enhance API client and LiveKit integration with authentication support ([`c7f93991`](https://github.com/kwami-labs/kwami/commit/c7f939914bc47b23470baded205a9157cc0b8a0f))
- Add light position management to Blob and Crystal renderers ([`4d2da45f`](https://github.com/kwami-labs/kwami/commit/4d2da45f624d99dd1460bc86591f27a32ba9bddd))
- Add particles renderer to Avatar class ([`7e867efd`](https://github.com/kwami-labs/kwami/commit/7e867efdef60f9f068248afb5fda23076f87bade))
- Add crystal-ball renderer ([`7d703380`](https://github.com/kwami-labs/kwami/commit/7d703380420e2df2c0b6765f4eefd395f04b34e1))
- Add orbital-shards renderer ([`a4f6bc63`](https://github.com/kwami-labs/kwami/commit/a4f6bc6312b9dd420caea94ba70d2b8a437b8f7d))
- Add stars-genesis renderer ([`638cc086`](https://github.com/kwami-labs/kwami/commit/638cc086d9b5d7f84d8cde33ff883cfa73f13d6e))
- Add StarField component to Scene for dynamic background stars ([`6bf1734e`](https://github.com/kwami-labs/kwami/commit/6bf1734efcfe7a1d961f22ea58c3da91dbb25112))
- Add Black Hole renderer with gravitational lensing effects ([`35950c94`](https://github.com/kwami-labs/kwami/commit/35950c94d4e3a811dc2f23452ad7e5fa9b615a46))
- Enhance Crystal Ball with texture-based marble effect and quality control ([`d2c61eac`](https://github.com/kwami-labs/kwami/commit/d2c61eaca68f980d0c082efbc8051543d7eaa0d4))
- Add live voice configuration update methods to Agent ([`80e243a4`](https://github.com/kwami-labs/kwami/commit/80e243a4d8ac45875b1625954aed93e10f71d726))
- Add orientation control system to all avatar renderers ([`a754ba8f`](https://github.com/kwami-labs/kwami/commit/a754ba8f6738ac100c4b0c95af19f4d11f3fe0a0))
- Add comprehensive memory management and graph analysis APIs ([`591b6710`](https://github.com/kwami-labs/kwami/commit/591b67106089ee3b19d737d7f98b199adc40611e))
- Add agent state synchronization for LiveKit ([`20de1b99`](https://github.com/kwami-labs/kwami/commit/20de1b992abf2cff9c9087e678149987b4ecfc1b))
- Enhance memory API with pagination and node connections ([`3d6f0c0c`](https://github.com/kwami-labs/kwami/commit/3d6f0c0c928cabb7cd18ca9cabd115749cd25c95))
- Handle search_results in LiveKitAdapter and dispatch kwami:search_results event ([`faf180e7`](https://github.com/kwami-labs/kwami/commit/faf180e7c57e1ba13e1da9fbf999917219f45428))
- Add onSearchResults callback and improve search_results handling in LiveKitAdapter ([`08347b62`](https://github.com/kwami-labs/kwami/commit/08347b628e2444874288e29a047a2a096ba79802))
- Search results: support image and features in payload and logging ([`1274c063`](https://github.com/kwami-labs/kwami/commit/1274c063d9ea10879d3944888e6644d138838746))
- LiveKit agent adapter and shared types ([`0dc8172d`](https://github.com/kwami-labs/kwami/commit/0dc8172da3e4646af204e50c76b2f4820cc1f3de))
- Blob XYZ normalized position helper ([`61e9fac2`](https://github.com/kwami-labs/kwami/commit/61e9fac2805ac67ff8c217ee67cdb0896a8380ff))
- Update LiveKitAdapter ([`0871a650`](https://github.com/kwami-labs/kwami/commit/0871a650131641845d1633ed212e166eb16fb5cc))
- Update Kwami, LiveKit adapter and types ([`6161791b`](https://github.com/kwami-labs/kwami/commit/6161791b6a406868324d122dbc181321ea8bfb12))

### Bug Fixes

- Update Kwami connection logic to use userId for kwamiId ([`bbde83fb`](https://github.com/kwami-labs/kwami/commit/bbde83fbf7153ea89d3af6d55285674cf49b9f46))
- Integrate Black Hole renderer into Avatar system ([`80712882`](https://github.com/kwami-labs/kwami/commit/80712882c6b9c867bf92a973b888cb1d88318614))
- Add image asset inlining plugin and TypeScript declarations for textures ([`4edb2f1b`](https://github.com/kwami-labs/kwami/commit/4edb2f1beb461c26ebcb044f543385e43c182f2c))
- Update Avatar renderer type documentation and remove humanoid placeholder ([`b11eb395`](https://github.com/kwami-labs/kwami/commit/b11eb39526d76db2454af239b080d9c21eb5a67e))

### Refactoring

- Refactor crystal-ball renderer ([`188da30d`](https://github.com/kwami-labs/kwami/commit/188da30d7f279029bfc400d3cf330c328ad376b2))
- Refactor avatar state transition cleanup logic ([`e88ebc1d`](https://github.com/kwami-labs/kwami/commit/e88ebc1d5292a98a615abf218f898d9c848a9ae5))
- Rename persona to soul throughout codebase and update package name ([`b8635313`](https://github.com/kwami-labs/kwami/commit/b863531347726e2bea50b67a86cfd2ac98793a74))

### Styling

- Update Avatar to support blob-xyz and crystal-ball renderers ([`b91a748e`](https://github.com/kwami-labs/kwami/commit/b91a748e15a59c78c8418069f54209ace176c904))
- Add marble texture assets for Crystal Ball renderer ([`0510c2d5`](https://github.com/kwami-labs/kwami/commit/0510c2d5b82a78038d9e93377fafa7c99b663441))
- Fix newline formatting in avatar scene exports ([`92e4591e`](https://github.com/kwami-labs/kwami/commit/92e4591e7b4c41d5c4140ea97fabf6e83e8e6434))

### Chores

- Remove pg-related scripts from package.json ([`35bcbb00`](https://github.com/kwami-labs/kwami/commit/35bcbb0012d79f957860f4db5aba0c04c2d35c18))
- Update public API exports for new renderers ([`a321519b`](https://github.com/kwami-labs/kwami/commit/a321519b0376545fc0428fe412cf1d9b88fa3b05))
- Remove deprecated crystal renderer ([`300c3f7e`](https://github.com/kwami-labs/kwami/commit/300c3f7ee0529488777e11290cb1b765505f9a28))
- Remove deprecated particles renderer ([`7777451c`](https://github.com/kwami-labs/kwami/commit/7777451cd428b0af171d34e7286d200086aaa99b))
- Update types and exports for Black Hole and StarField features ([`cd18ef48`](https://github.com/kwami-labs/kwami/commit/cd18ef4818e8ab0fb4496ef2245ecfc06ffbda5d))
- Cleanly overwrite main with v2 ([`b67895b4`](https://github.com/kwami-labs/kwami/commit/b67895b4ea465ec0e6e74dd172eb9f33e89b3989))

### Other

- Remove API key/secret auth and standardize on token-based authentication ([`1bc6c856`](https://github.com/kwami-labs/kwami/commit/1bc6c85692dcd330a5a90e45664640140d11c96d))
- Bump esbuild in the npm_and_yarn group across 1 directory ([`204ca96e`](https://github.com/kwami-labs/kwami/commit/204ca96e14a3ccf52513f6ed9a90b398192e1c48))
- Rename blob renderer to blob-xyz ([`3051e3a4`](https://github.com/kwami-labs/kwami/commit/3051e3a4404fcf05ad5790aa1b61b5e81ca15274))
- Replace crystal renderer with orbital-shards ([`678c861c`](https://github.com/kwami-labs/kwami/commit/678c861cff73bb051b90153abdd23c2f4ed01676))
- Replace particles renderer with stars-genesis ([`7d7985b9`](https://github.com/kwami-labs/kwami/commit/7d7985b92b2b34108817c77634cb3e589bbdeb1d))
- Bump keccak ([`5acb1aa0`](https://github.com/kwami-labs/kwami/commit/5acb1aa027a67acc37f969aae8e80a18e8500e2c))
- Bump rollup in the npm_and_yarn group across 1 directory ([`675f8604`](https://github.com/kwami-labs/kwami/commit/675f86046bce7121fa462d2e2e851409b7f72802))
- Bump minimatch in the npm_and_yarn group across 1 directory ([`8c406bab`](https://github.com/kwami-labs/kwami/commit/8c406bab46924713500c261d949c1aabba706fc5))
- Enhance Dependabot configuration for updates ([`f2ca6e45`](https://github.com/kwami-labs/kwami/commit/f2ca6e45d847cf4c6e8ef4cf22b77ddb56c990b1))
- Fix merge conflict with kwami-ai ([`277c4ebf`](https://github.com/kwami-labs/kwami/commit/277c4ebf54294bd03cd0a8d405701fe5e6b39b5e))

## [2.0.0-rewrite](https://github.com/kwami-labs/kwami/commit/81525ecd654c1fac965d62e0726a037260f01d8c) - 2026-01-21

_Ground-up rewrite (Jan 2026): agent, avatar renderers, memory, skills, LiveKit._

### Features

- Migrate market/ from Nuxt to Vite + TypeScript ([`6a3c6234`](https://github.com/kwami-labs/kwami/commit/6a3c623448c89272bfd806154b80e21b877f425d))
- Migrate dao/ from Nuxt to Vite + TypeScript ([`fbe1897a`](https://github.com/kwami-labs/kwami/commit/fbe1897afe9ceafefe0581df0756e33108373aca))
- **dao:** improve UI + wallet integration ([`823d0e13`](https://github.com/kwami-labs/kwami/commit/823d0e13537278be0eb9730ff0c2212b9481dcbe))
- **solana:** update Anchor programs + deploy scripts ([`fce9feba`](https://github.com/kwami-labs/kwami/commit/fce9feba9813d28617c07ff81a0ac35dc0b3fe1e))
- Add multi-wallet support to Candy app ([`f0cfa835`](https://github.com/kwami-labs/kwami/commit/f0cfa8351e320d8b8dde3a3abb1ed72b713f7e49))
- Candy: add background rings UI ([`0e347a8d`](https://github.com/kwami-labs/kwami/commit/0e347a8dd07dd11ee2bc06156dca14a493d3324e))
- Kwami: add UI rings + welcome animations ([`bd87c826`](https://github.com/kwami-labs/kwami/commit/bd87c826f18432b7fba34cb1cc5a19b65495ee37))
- Candy: use animated welcome rings background ([`3cdb9f2c`](https://github.com/kwami-labs/kwami/commit/3cdb9f2c18cee90746388edc57e6327edafb0b11))
- Add agent system ([`1bf95d24`](https://github.com/kwami-labs/kwami/commit/1bf95d24bf3aee31f479d928c436943ddc827177))
- Add persona system with templates ([`0cead7a9`](https://github.com/kwami-labs/kwami/commit/0cead7a90138c0bcb77ddb9407d6d6332e316c45))
- Add main Kwami class and exports ([`4bc34bfb`](https://github.com/kwami-labs/kwami/commit/4bc34bfb118bc6db79e949f58a173c5af60479d1))
- Add playground application ([`6b8639ab`](https://github.com/kwami-labs/kwami/commit/6b8639ab773e52afa1e8c21a4c8b3d91d68773f1))
- Add memory system ([`c6bebcd5`](https://github.com/kwami-labs/kwami/commit/c6bebcd5a52d6210efdcda740f3c5e3928f2c358))
- Add skills system ([`76bf72df`](https://github.com/kwami-labs/kwami/commit/76bf72df82aecf97a925e33094fc8b19b7cbf129))
- Update playground main entry point ([`8e5f718c`](https://github.com/kwami-labs/kwami/commit/8e5f718c79074eaaeb87ae2f3ac4ee86d0184e75))
- Add voice system for agent ([`5130dc75`](https://github.com/kwami-labs/kwami/commit/5130dc75590ce3317230a4922c5b569426eff879))
- Update agent system and adapters ([`c2430813`](https://github.com/kwami-labs/kwami/commit/c243081348281ae3d8109f061db8c994f1dba2e9))
- Add crystal renderer ([`6434a3e2`](https://github.com/kwami-labs/kwami/commit/6434a3e2b350369b81bfc14c853a8a0147989ea9))
- Add voice configuration panel ([`d4c9fa35`](https://github.com/kwami-labs/kwami/commit/d4c9fa35c9509a4681586355af8e75c7dd4fdfaf))
- Add enhancements panel ([`5dd08ae5`](https://github.com/kwami-labs/kwami/commit/5dd08ae5c4befe128bfe36c5ec29fbd1cd750ce4))
- Update skill manager ([`33904f50`](https://github.com/kwami-labs/kwami/commit/33904f506504f073273800e475a044f56a7eba9b))
- Update agent and LiveKit adapter ([`6c36a4a0`](https://github.com/kwami-labs/kwami/commit/6c36a4a0fa810c9630c0507f1efe61e9e5d2b05c))
- Update main Kwami class ([`ed5f0f93`](https://github.com/kwami-labs/kwami/commit/ed5f0f9362758b93cb46a07c88f87cbb2f6f3e65))
- Add standalone agent implementation ([`42b8e92d`](https://github.com/kwami-labs/kwami/commit/42b8e92d22233ab9dc94e9f6f6c5a140e53d97ca))

### Bug Fixes

- Tests: fix pg workspace tests after vitest upgrade ([`a1634427`](https://github.com/kwami-labs/kwami/commit/a1634427ca83e10532b12ff2d7c6b2db12838fce))
- Improve deploy script Solana CLI detection ([`4ab8c8a5`](https://github.com/kwami-labs/kwami/commit/4ab8c8a5bf067fb86e9a5686931f51138a3d9540))
- Standardize dev server ports and refactor npm scripts ([`a0cef5ca`](https://github.com/kwami-labs/kwami/commit/a0cef5ca8297341d6ab47ca461f34712849346c1))
- Fix Tailwind CSS imports in main.scss ([`a05572bf`](https://github.com/kwami-labs/kwami/commit/a05572bf0b7a6343624b258ef3cb1f9674c5883c))
- Fix Tailwind CSS version to v3.4.17 ([`0b9c4615`](https://github.com/kwami-labs/kwami/commit/0b9c4615cff7b4107f98050d64170b4d8172cfff))
- Fix import paths and TypeScript issues ([`1e50fc75`](https://github.com/kwami-labs/kwami/commit/1e50fc7585088ba531b697f4b7362ea18001c246))
- **candy:** align Vite 7 toolchain & TS config ([`13a585b3`](https://github.com/kwami-labs/kwami/commit/13a585b391d93832c1de1f39656bfbcc48684abd))
- **market:** wallet UI + metaplex robustness ([`463840c3`](https://github.com/kwami-labs/kwami/commit/463840c38555a351f7b3dc8e3ea3b80aa599fd7c))
- **dao:** adjust rollup externals ([`ebe4c7e1`](https://github.com/kwami-labs/kwami/commit/ebe4c7e1959c8b0e27afbb473a434d66a95f8f1e))
- **dao:** update wallet adapter imports ([`1d1c5b88`](https://github.com/kwami-labs/kwami/commit/1d1c5b88ff651b58f99f9097c9c112305a2dcbf9))
- **candy:** stop emitting vite.config artifacts ([`04ad3436`](https://github.com/kwami-labs/kwami/commit/04ad34367689bbf0add584c4b072a7d8f740329f))
- **dao:** optimizeDeps include @solana/buffer-layout ([`4393b909`](https://github.com/kwami-labs/kwami/commit/4393b9097a1b557287cd7759ae3f83c73dfe388d))
- **pg:** add missing feature modules ([`62b98951`](https://github.com/kwami-labs/kwami/commit/62b98951916c90638bce8d973e185161a5d7e0e4))
- Fix DAO Buffer polyfill initialization ([`db15d86e`](https://github.com/kwami-labs/kwami/commit/db15d86e37b45e8197e8420f8ef9ad71804b5c07))
- Improve version sync scripts ([`8346b043`](https://github.com/kwami-labs/kwami/commit/8346b043b524fdfa7e36279b9a5181839e255bc6))
- Update Anchor to 0.32.1 and add Solana dependency pins ([`69a94db4`](https://github.com/kwami-labs/kwami/commit/69a94db4b4f9b482a24e0bab0492d5798c3d1abd))
- Add project configuration files ([`687ef73e`](https://github.com/kwami-labs/kwami/commit/687ef73ec09f86d965a8a2586d177470a917af35))
- Add tools system ([`9752ed07`](https://github.com/kwami-labs/kwami/commit/9752ed071325b481cfb870c46945c0eea2f283aa))
- Update CI workflow configuration ([`2d093407`](https://github.com/kwami-labs/kwami/commit/2d0934072dfab867897e06ef82172dcfee1e846e))
- Update ESLint and package configuration ([`56908f33`](https://github.com/kwami-labs/kwami/commit/56908f33899a0096548f3d40af50884579cc736f))
- Update .gitignore ([`835a97aa`](https://github.com/kwami-labs/kwami/commit/835a97aac8aa0dff11f25ef319ce7bf0c48382fb))

### Refactoring

- **pg:** modularize UI + typings ([`433cf659`](https://github.com/kwami-labs/kwami/commit/433cf659fe38c0cf8f8c160eb4d0131728fb98bd))
- Refactor playground background management ([`1f0847e3`](https://github.com/kwami-labs/kwami/commit/1f0847e326dd2d274d3b87cab2968d3c1f1772e3))
- Migrate copy-assets script to TypeScript ([`34bb571e`](https://github.com/kwami-labs/kwami/commit/34bb571eac23fa7dfee46790ecdc0b9082cb0c7f))
- Refactor playground components ([`9b414164`](https://github.com/kwami-labs/kwami/commit/9b41416465450d6527fe86370af3ddf1856fe3a2))
- Refactor playground panel components ([`86ad78b8`](https://github.com/kwami-labs/kwami/commit/86ad78b87c024c313694aef67151df0cf22c3d80))
- Refactor agent, audio and avatar panels ([`513309f3`](https://github.com/kwami-labs/kwami/commit/513309f3df13476c7fab33722e970dd3b0d30d94))

### Build

- Update deps and Vite optimizeDeps ([`6f4af424`](https://github.com/kwami-labs/kwami/commit/6f4af42494a785a2cfd283fb3f6313c801b45c62))

### Documentation

- Migrate documentation to VitePress with i18n support (en/es) ([`83662966`](https://github.com/kwami-labs/kwami/commit/83662966c208d7c40e80907009c4393283ba686b))
- Refresh README ([`2f405340`](https://github.com/kwami-labs/kwami/commit/2f4053403dde430636b806b8c89ea38a5ae09720))
- Add TypeScript type definitions ([`32c4e899`](https://github.com/kwami-labs/kwami/commit/32c4e8999444eda189c7f0121e4687306f57fb6c))
- Add README documentation ([`a7efa48d`](https://github.com/kwami-labs/kwami/commit/a7efa48d50f13c90a39c837e82ed494adf886ed7))
- Update type definitions ([`d4dad346`](https://github.com/kwami-labs/kwami/commit/d4dad34606c7b09b417f09f224497a1300591c27))
- Add transcription panel ([`764c9f75`](https://github.com/kwami-labs/kwami/commit/764c9f7511d6ec52aa6ca54f2cf388e5b4524a95))

### Styling

- Add avatar system ([`acdc0c74`](https://github.com/kwami-labs/kwami/commit/acdc0c744057fe55d210a9d381577a4222a34200))
- Update blob renderer ([`1bb53fcb`](https://github.com/kwami-labs/kwami/commit/1bb53fcbbceaca06923d17e462dbc33e39c54a1b))
- Update avatar system with new renderers ([`caa8d57b`](https://github.com/kwami-labs/kwami/commit/caa8d57b8c41f0cee1e815fc6f636f469649c0c3))
- Update playground UI and navigation ([`0d2ea36e`](https://github.com/kwami-labs/kwami/commit/0d2ea36e79ac456a6aec8b212de60448ff99ddd0))

### Chores

- Security: fix critical vulnerabilities via overrides ([`23882eea`](https://github.com/kwami-labs/kwami/commit/23882eeae98c37f9b5f21bae7f0302dd5f9af14e))
- Deps: update vitest and vite to address vulnerabilities ([`46e9b00c`](https://github.com/kwami-labs/kwami/commit/46e9b00c598422f0cde9d1271ae5a2a01774ce55))
- Remove generated .vite files from git tracking and ignore them ([`b68ada7c`](https://github.com/kwami-labs/kwami/commit/b68ada7c188ad9b66c0c911009af5f1e983cd2d8))
- Update Node.js version to 22.12.0 for Render deployment ([`c1445e0f`](https://github.com/kwami-labs/kwami/commit/c1445e0f5d1efff390c87e6a596a9374f86d24af))
- Regenerate package-lock.json with npm 10.9.0 for Render compatibility ([`6a710277`](https://github.com/kwami-labs/kwami/commit/6a71027763ba1c6b8ccfdba629299801dbc7533d))
- Migrate candy app to Vite+Vue3 with TypeScript and Tailwind CSS dark/light mode ([`ab1982d3`](https://github.com/kwami-labs/kwami/commit/ab1982d388240f5a55134ac696c1c474c3308446))
- Update Anchor workspace configuration and dependencies ([`7124452a`](https://github.com/kwami-labs/kwami/commit/7124452a6418202761a76403f0c69973bfef0c5d))
- Optimize account handling with Box wrappers ([`08a33697`](https://github.com/kwami-labs/kwami/commit/08a33697de69e873a2fbc6b284455f6906d1fa80))
- Remove obsolete action system implementation doc ([`63817c01`](https://github.com/kwami-labs/kwami/commit/63817c01556ce34d5f09bb58b4949b0d9f5fd45f))
- Add installation script and dependency lock file ([`93d94d07`](https://github.com/kwami-labs/kwami/commit/93d94d07b0f03b9042f7ca3550793ef9fc26598a))
- Remove security audit document ([`84e521cf`](https://github.com/kwami-labs/kwami/commit/84e521cf46d2472d454ce2fbfc0abfbd0a7b000c))
- **git:** ignore generated artifacts ([`4d6093ce`](https://github.com/kwami-labs/kwami/commit/4d6093ce8cdb6181ff62e07fd2d60a5ef5350b7c))
- **solana:** write deploy records under target/ ([`ce35cd75`](https://github.com/kwami-labs/kwami/commit/ce35cd7576d4d2e46ad89e18aac4fedec20c64e7))
- ⬆️ Update Node.js version to 22.12.0 ([`c497ae9d`](https://github.com/kwami-labs/kwami/commit/c497ae9da06589cc58a0fe75ddf472174a43ce24))
- Add package dependencies ([`dd761490`](https://github.com/kwami-labs/kwami/commit/dd76149008ad24825f4a0168c9715f635f2a65df))
- Add build configuration ([`93aa2b23`](https://github.com/kwami-labs/kwami/commit/93aa2b2302ae9421ce19af2a66fb73e684ab8b83))
- Add CI/CD workflows ([`e3dd92df`](https://github.com/kwami-labs/kwami/commit/e3dd92df1b7a752e6adbf6a5cef5be6c9e444fa3))
- Add utility scripts ([`23a1952b`](https://github.com/kwami-labs/kwami/commit/23a1952bebc46da36685a2ed24a1e9f0c5f83005))
- _…and 8 more (see git history)_

### Other

- Add utility functions ([`4e7ef877`](https://github.com/kwami-labs/kwami/commit/4e7ef87732bf7e59cda7655671c75a5709a27d7e))
- Add metrics panel ([`92773584`](https://github.com/kwami-labs/kwami/commit/9277358485cc67f134eadc8bb293b2d24f2089bc))
- Initial commit: Fresh start for Kwami Principal App ([`81525ecd`](https://github.com/kwami-labs/kwami/commit/81525ecd654c1fac965d62e0726a037260f01d8c))

## [1.5.11](https://github.com/kwami-labs/kwami/commit/59b28176555b68d5f4b7e613828c67cb14017b25) - 2025-12-09

_Security republish / dependency overrides._

### Chores

- Security: bump version to 1.5.11 to resolve npm publish conflict ([`59b28176`](https://github.com/kwami-labs/kwami/commit/59b28176555b68d5f4b7e613828c67cb14017b25))

## [1.5.10](https://github.com/kwami-labs/kwami/commit/c866396bfd92bed8a4d9fe2132e956a99926eccc) - 2025-12-09

_Security republish after malware flag._

### Features

- Canvas dashboard & welcome animation ([`a6841c05`](https://github.com/kwami-labs/kwami/commit/a6841c05dfa4f23dde50da6bd36ff6dfe0d585f9))
- Add glass ui library ([`4df27497`](https://github.com/kwami-labs/kwami/commit/4df2749758b101c2be38695b83e948d16682b4c5))
- Add wallet app, text-to-speech examples, and various updates ([`293f06b1`](https://github.com/kwami-labs/kwami/commit/293f06b13403213e3b7386a92654b60b71079eeb))
- Update app registry, dashboard refactoring, and config updates ([`c99c2245`](https://github.com/kwami-labs/kwami/commit/c99c22453399ada7b557c8afeb4a978010e98c53))
- Update documentation, config files, and various improvements ([`728c82c9`](https://github.com/kwami-labs/kwami/commit/728c82c9933f31bc0a3f02a339a5bf9332a5bb5f))

### Bug Fixes

- Replace deprecated @pinia-plugin-persistedstate/nuxt with maintained version ([`10343d5d`](https://github.com/kwami-labs/kwami/commit/10343d5d9b4b0c381122529676f87a9f67ce5a54))

### Documentation

- Add comprehensive security audit report ([`db5014fa`](https://github.com/kwami-labs/kwami/commit/db5014fa9c9911b480ace25431f6b409e2cd9da6))

### Chores

- ⬆️ Update @solana/spl-token to 0.4.9 in dao, candy, and market workspaces ([`d9269cd8`](https://github.com/kwami-labs/kwami/commit/d9269cd882c83a7d1c3fd098e5f89a407b111ad8))
- ⬆️ Update vitest to 4.0.15 in web workspace ([`b8d0ec33`](https://github.com/kwami-labs/kwami/commit/b8d0ec33a2c7675f3a54c9db1a00532909de7512))
- Update package-lock.json after security fixes ([`5fe83781`](https://github.com/kwami-labs/kwami/commit/5fe8378144a097d6beaf21f582ea94ab167bbbd8))
- Security: bump version to 1.5.10 to resolve malware flag ([`c866396b`](https://github.com/kwami-labs/kwami/commit/c866396bfd92bed8a4d9fe2132e956a99926eccc))

### Other

- Bump node-forge in /docs in the npm_and_yarn group across 1 directory ([`a2e8a8f0`](https://github.com/kwami-labs/kwami/commit/a2e8a8f02e1d54ee6b321eb885dbf04b09059d5c))

## [1.5.9](https://github.com/kwami-labs/kwami/commit/3131cc978827ef64f42ebab1a69e8f9f90eb5f01) - 2025-11-25

_Action system, YouTube integration, theme manager, glass UI._

### Features

- Major web/ improvements: clean UI, modular code, cylindrical scroll effect ([`eb74c4eb`](https://github.com/kwami-labs/kwami/commit/eb74c4ebbe73c614a13cea6af8380d92877c7c56))
- Extract web managers and media modules ([`26599a3f`](https://github.com/kwami-labs/kwami/commit/26599a3f1cdf31167cfea660aeb50cccd6d2f861))
- Add comprehensive documentation and mobile/accessibility styles for pg/ v2.0 ([`1d0b2786`](https://github.com/kwami-labs/kwami/commit/1d0b278680d93a9dcc977d95a52753ecad5d9fd6))
- Complete all improvement phases: testing, performance, accessibility, SEO, and mobile optimization ([`97c41b20`](https://github.com/kwami-labs/kwami/commit/97c41b20d0eb8c5ac6fb97cf8448516d56e36765))
- Add Solana wallet integration to candy app ([`5d1f4fa4`](https://github.com/kwami-labs/kwami/commit/5d1f4fa4eb5afaafd2faba61531632ac3c935a96))
- Welcome experience and actions ([`c0104c8b`](https://github.com/kwami-labs/kwami/commit/c0104c8ba99112c0a3384870b4a243805a5b2b9a))

### Bug Fixes

- Fix port configuration for dev servers in workspace scripts ([`9278f135`](https://github.com/kwami-labs/kwami/commit/9278f135cd9f174d5a8cabf246ae21d78e64da91))
- Update playground vite config ([`0613fea0`](https://github.com/kwami-labs/kwami/commit/0613fea03d08c18049417c1295ffce198a7a0d9f))
- Update market nuxt config ([`61a29577`](https://github.com/kwami-labs/kwami/commit/61a29577499927cc4dc8dc497c8a1467644a819f))
- Fix workspaces: add dao, candy, market to root package.json ([`be28d7b2`](https://github.com/kwami-labs/kwami/commit/be28d7b298041c9ce189b244672bfb768471fbd6))
- Fix kwami dependency version for Render deployment ([`544977df`](https://github.com/kwami-labs/kwami/commit/544977dfc62fd15f21ce43a830d17ae8b40725db))
- Fix Render build: install dependencies before build ([`8ad20929`](https://github.com/kwami-labs/kwami/commit/8ad2092920acdec1eaf3bcd2903425418e87a886))
- Fix all wildcard kwami versions for Render deployment ([`dbf0a64c`](https://github.com/kwami-labs/kwami/commit/dbf0a64c51738f366eec954a4a7ca6679a215cea))
- Fix web deployment: use main branch and add npm install ([`52d86cb7`](https://github.com/kwami-labs/kwami/commit/52d86cb7d7455f701aa6afb5ae7ac80550dfeff6))
- Add .npmrc with legacy-peer-deps for Render deployment ([`d0c57ce8`](https://github.com/kwami-labs/kwami/commit/d0c57ce831a96f02d28a5061641287843b6a83df))
- Regenerate package-lock.json with --legacy-peer-deps ([`4c070ce5`](https://github.com/kwami-labs/kwami/commit/4c070ce5ad50101e6985003e6d66e1ccc399f5a0))
- Fix npm install invalid version ([`40b5efcc`](https://github.com/kwami-labs/kwami/commit/40b5efccbd3f92404f060c95d0d49f1738b31752))
- Fix Vue compiler error in ContentDoc slot usage ([`eca23ae2`](https://github.com/kwami-labs/kwami/commit/eca23ae2a9d05ce5bda6a0861073c3b8d0d8dd4e))

### Refactoring

- Migrate pg/ from JavaScript to TypeScript ([`967f45a5`](https://github.com/kwami-labs/kwami/commit/967f45a5ef06e295cfd361bad17990a4b3ae30a3))

### Documentation

- Update README documentation ([`cd41e52b`](https://github.com/kwami-labs/kwami/commit/cd41e52b33faf3eb389eb064af0b674f7eb46a2b))
- Complete documentation site with Docus-inspired features ([`9485ce9d`](https://github.com/kwami-labs/kwami/commit/9485ce9d99ba0fa4972a00c07bebee27c7054ee4))
- Add comprehensive completion summary ([`16733b13`](https://github.com/kwami-labs/kwami/commit/16733b13f70cb12b9746dfadc612ea34f83c0f39))
- Migrate documentation to new Nuxt-based structure ([`194751bc`](https://github.com/kwami-labs/kwami/commit/194751bcdbfba899e587e7c18d37dd6987794276))

### Tests

- Improve web/ test coverage and utilities ([`a38921b2`](https://github.com/kwami-labs/kwami/commit/a38921b27cdb54be56688a1186b1681c4a18d4e2))

### Chores

- Reorganize pg playground structure with proper src/ and public/ directories ([`c99fff2e`](https://github.com/kwami-labs/kwami/commit/c99fff2e5606d744a50d915860819ee66abddbdd))
- Add web landing page to Render deployment config ([`38b7e4df`](https://github.com/kwami-labs/kwami/commit/38b7e4df6cf3a4a5930f311bb075dc7e4060c846))
- Add complete Render deployment config ([`126af135`](https://github.com/kwami-labs/kwami/commit/126af1353c03625b033d5206e35ac116b58e439b))
- Remove duplicate docs assets ([`508ba61a`](https://github.com/kwami-labs/kwami/commit/508ba61ae2eb24d8c69302413a86c5b7f64868b6))
- Update root package dependencies ([`9d2dec87`](https://github.com/kwami-labs/kwami/commit/9d2dec877b74a63737f098d6b3cc33ad2b406ad7))
- Version 1.5.9: Action System, YouTube Integration, Theme Manager & Core Enhancements ([`3131cc97`](https://github.com/kwami-labs/kwami/commit/3131cc978827ef64f42ebab1a69e8f9f90eb5f01))

### Other

- Update copyright holder in LICENSE file ([`24e9f333`](https://github.com/kwami-labs/kwami/commit/24e9f33354037bb1077aa0a1c528f84049f39008))
- Improve sync-version script to be fully automatic and sync all versions to 1.5.8 ([`997c5b48`](https://github.com/kwami-labs/kwami/commit/997c5b48e7b06df443ff654503d6b640b6c458cf))
- Add Nuxt documentation site ([`344dd44b`](https://github.com/kwami-labs/kwami/commit/344dd44b56c509ed80207b72aa6ebaa53f5607e0))

## [1.5.8](https://github.com/kwami-labs/kwami/commit/c6d28b7836fe6ac8fd18675cf1e85fc43cdeed1c) - 2025-11-22

_Docker infrastructure for ecosystem projects._

### Features

- Add kwami dependency to all ecosystem projects ([`671dca6e`](https://github.com/kwami-labs/kwami/commit/671dca6edb39c361c715224f727947dcdf1037c2))

### Bug Fixes

- Sync all versions to 1.5.7 after merge ([`1e41303b`](https://github.com/kwami-labs/kwami/commit/1e41303b931acfab20567b5e332f1712f3a96a68))

### Chores

- Fix production build for workspace packages ([`fe88545f`](https://github.com/kwami-labs/kwami/commit/fe88545f63ba0aa99d4ee507b17cf08dedfeaa5f))
- Remove outdated Solana CONTRIBUTING.md and update documentation ([`0344a3f5`](https://github.com/kwami-labs/kwami/commit/0344a3f525c8fc9c6e3b795febc502ba0bbb86a8))
- V1.5.8: Add comprehensive Docker infrastructure for all projects ([`c6d28b78`](https://github.com/kwami-labs/kwami/commit/c6d28b7836fe6ac8fd18675cf1e85fc43cdeed1c))

### Other

- Merge main into dev - Resolved conflicts, keeping v1.5.7 ([`125915a0`](https://github.com/kwami-labs/kwami/commit/125915a0b738c3cda0f1e43797ca85623407c531))

## [1.5.7](https://github.com/kwami-labs/kwami/commit/977ebe81a0a9fa458187722394169ee679b9fc56) - 2025-11-22

_Cross-package version synchronization._

### Bug Fixes

- Improve sync-version script to update all versions across ecosystem ([`fe4fedbf`](https://github.com/kwami-labs/kwami/commit/fe4fedbf362462fc2f350a762feff1c97a2b46fa))

### Documentation

- Fix core library paths in documentation ([`7293224b`](https://github.com/kwami-labs/kwami/commit/7293224be013fb494c9783023a10a2f4f2e1242b))

### Chores

- Release v1.5.7 - Enhanced version synchronization ([`977ebe81`](https://github.com/kwami-labs/kwami/commit/977ebe81a0a9fa458187722394169ee679b9fc56))

## [1.5.6](https://github.com/kwami-labs/kwami/commit/78decd4ee45c190995ce63cc51a4e8b778859dfb) - 2025-11-22

_OIDC Trusted Publishers for npm._

### Bug Fixes

- Fix trailing whitespace in market/README.md ([`5570fdea`](https://github.com/kwami-labs/kwami/commit/5570fdea4d70887503e1202a9f9c15d9ca5dad04))
- Fix sync-version script to update all version references ([`d97218e4`](https://github.com/kwami-labs/kwami/commit/d97218e4c27431d6433c8f1a2a29cd145c9c8b16))
- Comprehensive version sync to 1.5.5 across all files ([`30f79258`](https://github.com/kwami-labs/kwami/commit/30f7925878776cd43f559917e48920f17ef7531e))
- Fix npm publish - Remove NODE_AUTH_TOKEN for OIDC Trusted Publishers ([`3cb5e5d6`](https://github.com/kwami-labs/kwami/commit/3cb5e5d6999dcc15cdcdf8e1b77bbdec430acdc3))

### Chores

- V1.5.6 - Fix OIDC publishing + comprehensive version sync ([`78decd4e`](https://github.com/kwami-labs/kwami/commit/78decd4ee45c190995ce63cc51a4e8b778859dfb))

## [1.5.5](https://github.com/kwami-labs/kwami/commit/a8e8f22a39af0215a1b9ad37e8471fc963962777) - 2025-11-22

_AGPL-3.0 + Commercial dual license._

### Documentation

- V1.5.5 - Update to AGPL-3.0 + Commercial dual license ([`a8e8f22a`](https://github.com/kwami-labs/kwami/commit/a8e8f22a39af0215a1b9ad37e8471fc963962777))

## [1.5.4](https://github.com/kwami-labs/kwami/commit/c4448f4dabc4acc302295cb6aad616fa71c64008) - 2025-11-22

_Publish retry._

### Bug Fixes

- Fix npm publish to use cd instead of -w flag ([`b7836e98`](https://github.com/kwami-labs/kwami/commit/b7836e98cb9f42164a6bec10efbf96d0989b7adf))

### Documentation

- Update documentation paths for kwami/ folder structure ([`66c86ec4`](https://github.com/kwami-labs/kwami/commit/66c86ec4ee3ab91832ca662d31e50c43787674b1))

## [1.5.3](https://github.com/kwami-labs/kwami/commit/e7fe4354447123e204a3aa1e8edab92237917d84) - 2025-11-22

_npm publish workflow for monorepo._

### Bug Fixes

- Fix GitHub Actions publish workflow for monorepo ([`d135a903`](https://github.com/kwami-labs/kwami/commit/d135a9035898461667ad109bc9c93109b77b6c89))
- Fix all test imports and Three.js references for monorepo structure ([`0c89e9df`](https://github.com/kwami-labs/kwami/commit/0c89e9df9c4a22adf442cf567709adc62e68a51d))

### Chores

- Update package versions and documentation ([`0f9f90c3`](https://github.com/kwami-labs/kwami/commit/0f9f90c38ea1c2d321acc14a1772cd638aedc5fe))

## [1.5.2](https://github.com/kwami-labs/kwami/commit/d9ad2eaea2ab4174eb27929f2d90dca4eedf17b1) - 2025-11-22

_Package version sync across monorepo._

### Features

- Update web app with Phase 3 enhancements ([`d7ce875b`](https://github.com/kwami-labs/kwami/commit/d7ce875b3470320201e0350a12063567e30051f2))
- Add playground (pg) directory structure ([`dc95d803`](https://github.com/kwami-labs/kwami/commit/dc95d803f797eee9eeb3ed27d5b0eb619f0af3b7))
- Add web onboarding and minimap features ([`ffbd094e`](https://github.com/kwami-labs/kwami/commit/ffbd094e922357c4f1c2823f512cbbbf9d9918aa))

### Refactoring

- Clean up and reorganize project structure ([`4bbff622`](https://github.com/kwami-labs/kwami/commit/4bbff622ed7d351b5db99c33414161f273eca7d2))
- Major refactoring and reorganization ([`5325da35`](https://github.com/kwami-labs/kwami/commit/5325da35bac0a1316e82e8d760d2c93e93ba4f10))
- Finalize project structure reorganization ([`588d31ac`](https://github.com/kwami-labs/kwami/commit/588d31acb637e0f74c1f16892168b715729924f9))

### Documentation

- Restructure documentation and add app CHANGELOG ([`026ada7c`](https://github.com/kwami-labs/kwami/commit/026ada7c5fa065faf8b9ea562d28b198521c46a5))
- Update version to 1.5.2 and CHANGELOG ([`d9ad2eae`](https://github.com/kwami-labs/kwami/commit/d9ad2eaea2ab4174eb27929f2d90dca4eedf17b1))

### Styling

- Update Candy Machine implementation ([`b7ed478b`](https://github.com/kwami-labs/kwami/commit/b7ed478bb4a7abd157bacecda190b345ba593436))

### Chores

- Update Solana programs and infrastructure ([`62c76f03`](https://github.com/kwami-labs/kwami/commit/62c76f037a4910f1c215c60b91c0a892d5886f6f))
- Update DAO and Marketplace documentation ([`33c1aa5c`](https://github.com/kwami-labs/kwami/commit/33c1aa5c4a2a3d029f8b43d2a30c2d71ef6a72a5))
- Update root configuration and deployment guides ([`80112f48`](https://github.com/kwami-labs/kwami/commit/80112f48e8c5e0ba8bf7b0721df32fbaebbffdd3))
- Add Solana deployment scripts and documentation ([`d4f09bbd`](https://github.com/kwami-labs/kwami/commit/d4f09bbdcfccc8506e7de2da28cdb4efd3ee3b42))

## [1.5.1](https://github.com/kwami-labs/kwami/commit/df909b2df7d21c0f15436e7fd5e9bc24eedcdd44) - 2025-11-22

_Kwami App (Nuxt) and monorepo documentation._

### Features

- Update QWAMI token to integer token (0 decimals) aligned with source of truth ([`39e0daaf`](https://github.com/kwami-labs/kwami/commit/39e0daafaac1262faf0bfce06f6df2aa6efcc40d))
- Complete candy Nuxt4 app with Socket.IO and Three.js integration ([`3a22ebe5`](https://github.com/kwami-labs/kwami/commit/3a22ebe506b35cff91d9fcb2a1ecb8a80f4a1a90))
- Add DAO, marketplace, and Solana documentation and updates ([`be76f47d`](https://github.com/kwami-labs/kwami/commit/be76f47d1c62606499670a6d68731a9d1e75b697))
- Complete KWAMI NFT minting implementation ([`d528863c`](https://github.com/kwami-labs/kwami/commit/d528863c7091b8607fc195199772943c8f66a24d))
- Add Kwami App - Nuxt 4 web application with Quami structure ([`0212445e`](https://github.com/kwami-labs/kwami/commit/0212445e13bcd34b1ca4660c338be458833dc14b))

### Bug Fixes

- Fix build errors for npm publish ([`8e441de7`](https://github.com/kwami-labs/kwami/commit/8e441de73f9fbccfa65b08cd79862516264df572))
- Fix candy app Nuxt 4 compatibility - remove @vueuse dependencies ([`6d4e1cdf`](https://github.com/kwami-labs/kwami/commit/6d4e1cdfa55e149ce9fa8f6dad155d633f0cfb3c))
- Fix candy deployment: add .npmrc and render.yaml configuration ([`abe6798f`](https://github.com/kwami-labs/kwami/commit/abe6798fd14986c083744981dcb62ea8e4e9a261))
- Fix candy/dao/market build scripts to use Nuxt instead of Vite ([`6ebdda74`](https://github.com/kwami-labs/kwami/commit/6ebdda74262653756aea97ea9f75fae907d8bcc0))
- Fix candy start command path for Render deployment ([`94c83962`](https://github.com/kwami-labs/kwami/commit/94c83962e8bc499f023c1c2bb792da7d29c63b96))
- Fix marketplace Render deployment configuration ([`8baa29f3`](https://github.com/kwami-labs/kwami/commit/8baa29f3f4b16a5a54e555560bd459d1790544bc))

### Refactoring

- Move assets folder to playground/assets and update references ([`21cce63c`](https://github.com/kwami-labs/kwami/commit/21cce63cf885b1b77cd7efeabe4a7ae1abce25e5))
- Refactor Solana Anchor projects structure ([`480608ce`](https://github.com/kwami-labs/kwami/commit/480608ce0defe67431ce07d1534a7f8c2edf1f3d))

### Documentation

- Update Mind documentation for v1.4.1 features ([`49211b3f`](https://github.com/kwami-labs/kwami/commit/49211b3f15bd5b6a90a71d17916c123abd40e5da))
- Add web improvement plan and DAO installation docs ([`a133ab0d`](https://github.com/kwami-labs/kwami/commit/a133ab0dec90ee515ab3f1cf56f8e50ceed103a7))
- Add comprehensive documentation and deployment configuration ([`390bfa48`](https://github.com/kwami-labs/kwami/commit/390bfa48b9d2f9ebf33877fb6305b878af22eac8))
- Update documentation for Kwami App v1.5.1 ([`df909b2d`](https://github.com/kwami-labs/kwami/commit/df909b2df7d21c0f15436e7fd5e9bc24eedcdd44))

### Chores

- ⬆️ Update web app to kwami v1.4.1 with full compatibility verification ([`d564a5ca`](https://github.com/kwami-labs/kwami/commit/d564a5cac3f058e182b9b56b385fdab3df7c81b1))
- Complete KWAMI NFT Marketplace implementation with Metaplex integration ([`3f827509`](https://github.com/kwami-labs/kwami/commit/3f827509b71918fcaf75af9649770158c58d2a40))
- Update package dependencies ([`967e533f`](https://github.com/kwami-labs/kwami/commit/967e533fd78c152fea2a0769a0a2d109ace2520c))

## [1.4.1](https://github.com/kwami-labs/kwami/commit/73ac47978315e5e51b40953a63ebd3ca50ee13bc) - 2025-11-19

_ElevenLabs Conversational AI Agents; candy/web/Solana apps expand._

### Features

- Implement upload functionality for background media ([`962783d0`](https://github.com/kwami-labs/kwami/commit/962783d0810444134ddcd8d6b8cff74bd221acd7))
- Add customizable app color picker with 12 Tailwind color presets ([`86adb69e`](https://github.com/kwami-labs/kwami/commit/86adb69e048b82db71fbd4cca672f1adb94e99b7))
- Add theme-aware color persistence for light and dark modes ([`f79c1730`](https://github.com/kwami-labs/kwami/commit/f79c1730f82fcf3d800e8d66bd8ca6dcbdd94e63))
- Automatically invert color when switching themes ([`c63191a5`](https://github.com/kwami-labs/kwami/commit/c63191a5fde36c0b82e5fa07ee6bd99f3784048b))
- Improve media controls and replace hamburger with ghost emoji ([`357e6d75`](https://github.com/kwami-labs/kwami/commit/357e6d75ccb94fd1b8063f55d2b3457d540ac7d4))
- Enhance color picker with full Tailwind palette and circular design ([`6f2a8f3a`](https://github.com/kwami-labs/kwami/commit/6f2a8f3a611c4a2e3baec581b54b6cf8af205ee7))
- Playground: refine demo (HTML/JS/CSS) ([`1dd0726d`](https://github.com/kwami-labs/kwami/commit/1dd0726d1b35716888c96f1f35088a17b25087a2))
- Web: add new web/ directory ([`6d55727f`](https://github.com/kwami-labs/kwami/commit/6d55727f6ec83e7bb22c1eb45720310c07401d57))
- Candy: add initial candy/ directory ([`2303a66c`](https://github.com/kwami-labs/kwami/commit/2303a66c3e3ec7844a5c225e08073ed7aaa1ca46))
- Add Anthropic Claude model support to web interface ([`b6e41a99`](https://github.com/kwami-labs/kwami/commit/b6e41a993bc7ff26bc2d8f9d5d08f406eecb100c))
- Configure Kwami blob with playground settings and enable interactions ([`1f3d6266`](https://github.com/kwami-labs/kwami/commit/1f3d62661bf36075e2b73ec0f3b7741ebcefea13))
- Update playground with Claude model support ([`afc9045b`](https://github.com/kwami-labs/kwami/commit/afc9045bb6f2493ab5cf8ca9e81cb3e9303dabf4))
- Enhance web interface with improved Claude model integration ([`74783748`](https://github.com/kwami-labs/kwami/commit/74783748ccb9b7f45d081cfb4b6b01290e378134))
- Update playground asset paths to absolute routes ([`54233c7e`](https://github.com/kwami-labs/kwami/commit/54233c7e90a0d78af5978f21badf9a36acfa5d83))
- Add streaming support and improve web interface responsiveness ([`50ed879f`](https://github.com/kwami-labs/kwami/commit/50ed879f794e3447aaae46840913fbae64965550))
- Reorganize audio assets and update codebase ([`19a5cdff`](https://github.com/kwami-labs/kwami/commit/19a5cdff142b88ae5e52fd2bb2ee16b027a0862c))
- Add i18n support with EN/ES/FR translations ([`a06903af`](https://github.com/kwami-labs/kwami/commit/a06903afbfc614c9c804f0e7924918c70aee93eb))
- Add i18n to web ([`5de8b6dd`](https://github.com/kwami-labs/kwami/commit/5de8b6dde38d23ef7abad70a20792f6f8045c8eb))
- Add i18n improvements with section messages support ([`b79278a1`](https://github.com/kwami-labs/kwami/commit/b79278a1013de146194896aaa2af047a19549ad9))
- Add video download script for YouTube videos ([`8af1afe0`](https://github.com/kwami-labs/kwami/commit/8af1afe006c3decbab86266147d0e9bc4ba64ffa))
- Add welcome layer component with GSAP animations ([`26580af9`](https://github.com/kwami-labs/kwami/commit/26580af9470b8495ce613e42ec4594153f6df44e))
- Add multiple language locales and update welcome layer components ([`fc96b39a`](https://github.com/kwami-labs/kwami/commit/fc96b39a53516dc17c21b0003ccd4e60659e33d4))
- Fix video blob toggle: click Kwami to switch between background/glass modes ([`189f6978`](https://github.com/kwami-labs/kwami/commit/189f6978711d49bb5e0c08921d2312a48f07c468))
- Fix music lowpass toggle: click Kwami blob to toggle filter (not tab button) ([`3bcf662b`](https://github.com/kwami-labs/kwami/commit/3bcf662b17f7ae27314a4dc7d6c4b9fa2144386c))
- Add multiple language locales and update UI components ([`8040f1a2`](https://github.com/kwami-labs/kwami/commit/8040f1a23c67a86e3ed4068ad23a931dd7c7eb44))
- Switch to npm Trusted Publishers (provenance) ([`3a6f0782`](https://github.com/kwami-labs/kwami/commit/3a6f07820fb1408cfda1feff0675571b6209137d))
- Complete ElevenLabs Conversational AI Agents integration (v1.4.1) ([`73ac4797`](https://github.com/kwami-labs/kwami/commit/73ac47978315e5e51b40953a63ebd3ca50ee13bc))

### Bug Fixes

- **playground:** make canvas fixed to screen size with overlay sidebars ([`d4c7ab9b`](https://github.com/kwami-labs/kwami/commit/d4c7ab9b2208356217067d5afd9a3d30e827f1a2))
- Update test paths to src/tests/ ([`4d138f27`](https://github.com/kwami-labs/kwami/commit/4d138f27c27867739300275c1710aa99b26699eb))
- Fix random buttons: use IMAGE_PRESETS and VIDEO_PRESETS arrays ([`175e159a`](https://github.com/kwami-labs/kwami/commit/175e159adf25af58ab8b7108eb61675d86c6cd85))
- Fix Random Bg Glass and Random 3D Texture to apply media immediately ([`eb134b51`](https://github.com/kwami-labs/kwami/commit/eb134b51d6dff8d151d5e0801002c985959f693f))
- Fix Random Canvas Gradient to create 3 random spheres ([`c0b4481e`](https://github.com/kwami-labs/kwami/commit/c0b4481e4c9731dad759c1a96e416e7a5b9d9b41))
- Update remaining purple UI elements to use selected color ([`c4a110b0`](https://github.com/kwami-labs/kwami/commit/c4a110b0e40a0fc49f6f3a60114ba8541518f7ad))
- Replace remaining purple colors with theme-aware grays ([`6086b8c8`](https://github.com/kwami-labs/kwami/commit/6086b8c88c4345037523c224c2e81325ca9bb072))
- Improve media loader tab visibility with white text on active tabs ([`c1084c68`](https://github.com/kwami-labs/kwami/commit/c1084c68f75f1fc8ba9363063d3960ceb9f8fcdb))
- Improve visual differentiation for media loader tabs ([`94de8b65`](https://github.com/kwami-labs/kwami/commit/94de8b65ceb928772d18b5bd2f249a00ec2a7103))
- Replace all remaining purple colors in media loader with dynamic color ([`a5da2c0b`](https://github.com/kwami-labs/kwami/commit/a5da2c0bd8af4b864509069e5e974f40b4636fa7))
- Replace all remaining hardcoded purple colors with dynamic variables ([`9f4bb60e`](https://github.com/kwami-labs/kwami/commit/9f4bb60eb49b273b947f673561ea1a621b85fc5c))
- Refactor socket implementation and update playground assets ([`7f057ce4`](https://github.com/kwami-labs/kwami/commit/7f057ce43284e0546c8c520c44ab073ab89aaee3))
- Core(scene): fix OrbitControls import path ([`0626301d`](https://github.com/kwami-labs/kwami/commit/0626301d3112848cb66ab9d3875b777fe3889aa8))
- Fix blob interaction method name ([`5099c736`](https://github.com/kwami-labs/kwami/commit/5099c7362f3530136e1ef643d60760e808398cb2))
- Reorganize assets and update web interface styling ([`c35a7a86`](https://github.com/kwami-labs/kwami/commit/c35a7a8686de000053ecb7249484d49f3c9d5159))
- Fix kwami blob becoming rounded when audio starts ([`ef9e5f9d`](https://github.com/kwami-labs/kwami/commit/ef9e5f9d3216797e526e5451634773ec5fe3c2a7))
- Add prebuild script and @types/three for deployment ([`930cf3ee`](https://github.com/kwami-labs/kwami/commit/930cf3ee0c4e32cf7c6e22b5273a2f612328a0b9))
- Fix deployment: remove conflicting lock files and add .npmrc ([`9e0fb463`](https://github.com/kwami-labs/kwami/commit/9e0fb46359a48ad8843c674c2d7f74652a54c604))
- Update translations and add translation tools ([`9ea16dac`](https://github.com/kwami-labs/kwami/commit/9ea16dacdf4fc0b379f2dc7021f55aa507c59757))
- Reorganize Solana structure and update web components ([`cfcef4f0`](https://github.com/kwami-labs/kwami/commit/cfcef4f079941977719811b6235dbca03905b0af))
- Fix typo in workflow name ([`dd603de2`](https://github.com/kwami-labs/kwami/commit/dd603de274f12a41ae461154034c030fd4b539ef))
- Fix all 238 tests and prepare package for npm publish ([`f651fad2`](https://github.com/kwami-labs/kwami/commit/f651fad282a0e269cc6493d9466588bb4d7862af))

### Refactoring

- Refactor media loader: full-width dropzone, button below, remove redundant random buttons ([`f04689b7`](https://github.com/kwami-labs/kwami/commit/f04689b79bb972c29f3bb82eb931a1f8cbb65464))
- Update asset paths: playground/assets/img/bg and playground/assets/vid/bg ([`9b0e2796`](https://github.com/kwami-labs/kwami/commit/9b0e27969c71259d1343e432d189972a7838e8cb))
- Reorganize audio assets and update core components ([`1bb667cf`](https://github.com/kwami-labs/kwami/commit/1bb667cfe44b3f752aa7352bd5dd25883a21409a))

### Documentation

- **core/mind:** update README ([`25088408`](https://github.com/kwami-labs/kwami/commit/250884081299c93dd612dd46d9b08961ff10cc95))

### Tests

- Add comprehensive test suite with Vitest ([`9409ab27`](https://github.com/kwami-labs/kwami/commit/9409ab270e5a338cabe2e4e6e93dc0e3885c1921))

### Styling

- Resize media loader: bigger dropzone, smaller button (50/50 split) ([`0376315b`](https://github.com/kwami-labs/kwami/commit/0376315b312243671822daffc2aa853dc2e81a55))
- Web: refine Vite app (index, main, styles, tsconfig, deps) ([`8e6916e0`](https://github.com/kwami-labs/kwami/commit/8e6916e00ecc28a3351f2f66ce42acc1407c0151))
- Update welcome layer styles and components ([`91d76002`](https://github.com/kwami-labs/kwami/commit/91d76002c3a14210e5e22b53a5bc5b286889e96d))
- Update welcome layer CSS styles ([`c8bbbaf9`](https://github.com/kwami-labs/kwami/commit/c8bbbaf9909c34eb2bedecd72275d04ea2c0c6be))

### Chores

- Add Vite config to handle GLSL shaders for kwami npm package ([`19370ca4`](https://github.com/kwami-labs/kwami/commit/19370ca4ff8d81ce130192b4e273f622f2835d4b))
- Add Claude model support to candy Nuxt app ([`3715f953`](https://github.com/kwami-labs/kwami/commit/3715f9535e0f1914539cc4ae97c1731baf6edec9))
- Configure build tools for shared assets ([`8195e970`](https://github.com/kwami-labs/kwami/commit/8195e970007b30be7d8e021de65437dc02bbcab7))
- Update WelcomeLayer and main components ([`015722ee`](https://github.com/kwami-labs/kwami/commit/015722ee734d4d69037c4969af919b638c963ca6))
- Remove backup files and documentation ([`85a9da3f`](https://github.com/kwami-labs/kwami/commit/85a9da3f1f473a0971af4d6edaa7016d3a2702d6))
- Update main.ts ([`b6a50140`](https://github.com/kwami-labs/kwami/commit/b6a50140a21d42c4ed2a1739482fa494c1c23a34))
- Add missing dependencies to web package.json ([`cccfdabc`](https://github.com/kwami-labs/kwami/commit/cccfdabcb7fdd6f88d1ec5de811e322c618db28d))
- Update package-lock.json ([`3c696da2`](https://github.com/kwami-labs/kwami/commit/3c696da2106c9a67ba3f0b60194d320b6e60daa4))
- Add automated npm publishing with GitHub Actions ([`c3396930`](https://github.com/kwami-labs/kwami/commit/c3396930f156dc8deb67e932a0e8045b96ece8fe))
- Add npm provenance to publish workflow ([`998beeab`](https://github.com/kwami-labs/kwami/commit/998beeabee740a3d2ca61e10bd1dc981cd999ffe))

### Other

- Add kwami.io directory with README ([`7a7f3492`](https://github.com/kwami-labs/kwami/commit/7a7f34929f6821ef07d51af6eceaccee68503a56))
- Kwami.io: remove legacy app in favor of web/candy ([`6fe20200`](https://github.com/kwami-labs/kwami/commit/6fe202003397677716a174d9251ef1248ac1ecb8))
- \ud83d\udc1b Fix Kwami blob initialization with better error handling and debugging ([`c7656ff4`](https://github.com/kwami-labs/kwami/commit/c7656ff4409804d3d41c9b60819ea04d75864dba))
- Add media links configuration file ([`04eb5e49`](https://github.com/kwami-labs/kwami/commit/04eb5e495cb9e8ed9428ac6b26f35bef5e336815))
- Optimize build to reduce memory usage ([`faabcfe6`](https://github.com/kwami-labs/kwami/commit/faabcfe612d25ee26c475010a24bf567c7dcc0e9))

## [1.3.2](https://github.com/kwami-labs/kwami/commit/8356373e1e5194359967e2103cc94b1a29cf9034) - 2025-11-15

_Skills system (JSON/YAML), Mind UI, media loader, Vitest suite._

### Features

- V1.3.2: Add Skills UI to Playground Mind Sidebar ([`8356373e`](https://github.com/kwami-labs/kwami/commit/8356373e1e5194359967e2103cc94b1a29cf9034))

### Features

- V1.3.2: Add Kwami Skills System - Behavior Programming via JSON/YAML ([`b89e241f`](https://github.com/kwami-labs/kwami/commit/b89e241f170883179f3753a68f0ada5f10cf830d))

### Other

- Replace clear buttons with upload buttons for background media ([`341653e3`](https://github.com/kwami-labs/kwami/commit/341653e3fd57559c67ad49926c9dd3c0816f6e91))

### Documentation

- V1.3.2: Add Mind placeholder directories (actions, rules, skills) ([`bb706ea1`](https://github.com/kwami-labs/kwami/commit/bb706ea18992804d7e3a4eeb76902dfb2be88685))

### Features

- Add all 20 personality templates to Soul sidebar menu in playground ([`f4babe43`](https://github.com/kwami-labs/kwami/commit/f4babe43d1e1f3a69fa58686918961ace6f5f9b9))
- Center value badge perfectly in trait header using CSS Grid ([`665eebcb`](https://github.com/kwami-labs/kwami/commit/665eebcb3f79e0d8639b700148d45e18fe5708b7))
- Minor UI spacing improvements ([`54194ec6`](https://github.com/kwami-labs/kwami/commit/54194ec659a37cba0f446cc04783a2aaa9c37eef))
- V1.3.2: Mind UI improvements with provider logos and UX enhancements ([`28415a09`](https://github.com/kwami-labs/kwami/commit/28415a090c43a7f7fba9418c0a62704175ab2327))

### Styling

- Improve emotional traits UI: compact, gray design with better layout ([`69a1d92d`](https://github.com/kwami-labs/kwami/commit/69a1d92df48c1d34beb6cb22764c93d030446c5b))

### Chores

- Remove unused responseLength and emotionalTone fields from playground Soul UI ([`be65fb4e`](https://github.com/kwami-labs/kwami/commit/be65fb4e46c34812c756a63b5ba5b1fb6179d0f3))
- Add deno.lock and yarn.lock for reproducible builds ([`71ccd6eb`](https://github.com/kwami-labs/kwami/commit/71ccd6ebdb06514d5909fcb626a88b3e963d9ce7))

### Other

- Add more assets ([`492862ef`](https://github.com/kwami-labs/kwami/commit/492862ef069f3dc08f282e424f70373ae9c92a02))

## [1.3.1](https://github.com/kwami-labs/kwami/commit/165d9caeebf35ed327ba9dbdc44e8aaf4e5e2de7) - 2025-11-15

_20 Soul personality templates + playground UI._

### Documentation

- Comprehensive documentation overhaul and v1.3.1 ([`165d9cae`](https://github.com/kwami-labs/kwami/commit/165d9caeebf35ed327ba9dbdc44e8aaf4e5e2de7))

### Features

- Added Emotional Traits Sliders to Playground Soul Menu ([`b8f6028e`](https://github.com/kwami-labs/kwami/commit/b8f6028e925258a2662ac982efc6b0a0de01bf10))
- Add Emotional Traits UI to Playground Soul Sidebar ([`20400e98`](https://github.com/kwami-labs/kwami/commit/20400e98adde490f5cab38bd5d21318944ec0b29))
- Complete Soul Sidebar Refactor with LocalStorage & Dual Emojis ([`c164bd73`](https://github.com/kwami-labs/kwami/commit/c164bd7303da71c0498695097e060e6c143c5d58))
- V1.3.1: Expand Soul personality templates with 20 diverse AI personalities ([`82f4b1e2`](https://github.com/kwami-labs/kwami/commit/82f4b1e23caa2097b50c6556d6a8fd70cd7edb16))

## [1.3.0](https://github.com/kwami-labs/kwami/commit/1dc464f6ae39a61932849786580246f3bce8ace2) - 2025-11-14

_Ecosystem version reset — provider architecture, OpenAI TTS, soul emotions._

### Features

- Fix Random Gradient: use applyBackground() path so DOM overlay updates correctly ([`91f487e7`](https://github.com/kwami-labs/kwami/commit/91f487e75bce3eb67b5f092492cac49312a889b9))
- Refactor scene setup and playground media ([`661df688`](https://github.com/kwami-labs/kwami/commit/661df68855e0ed28f0ae59128367314247411dfd))
- Restore gradient overlays over media ([`f9638735`](https://github.com/kwami-labs/kwami/commit/f96387357478e753fdf4eed28807b57806c95fa2))
- Refactor mind provider architecture ([`dbe98ef7`](https://github.com/kwami-labs/kwami/commit/dbe98ef7047967542f3f70390f20fefd96aeff55))
- Complete Emotional Personality System Overhaul ([`558efa26`](https://github.com/kwami-labs/kwami/commit/558efa264856d7bf77e316016b821e4ca8393267))

### Bug Fixes

- **playground:** copy agent-management-functions.js to dist on build ([`ec8f6ad8`](https://github.com/kwami-labs/kwami/commit/ec8f6ad8848e4552f0cacde5c55b5e6b4d6faf77))

### Documentation

- Expand body README 🧠 ([`57123a69`](https://github.com/kwami-labs/kwami/commit/57123a693bfeb1b4440a56a00a77cd4827227054))
- Document gradient overlay + mind provider refactor ([`880bc8af`](https://github.com/kwami-labs/kwami/commit/880bc8af5fc8329a8e530a55f7844d9054b919a3))
- Complete Soul System Documentation ([`cc640b5a`](https://github.com/kwami-labs/kwami/commit/cc640b5a760040540b6748a37277be4d1c59f903))

### Chores

- Add Dockerfile for playground ([`708c24f0`](https://github.com/kwami-labs/kwami/commit/708c24f07c12fb59ec38b4e2906f921201654452))

### Other

- Update Playground UI section in README ([`f0d34bdf`](https://github.com/kwami-labs/kwami/commit/f0d34bdffff6fe7d940281942d2d7a86a02f4443))

## [2.2.7](https://github.com/kwami-labs/kwami/commit/e825fb1cc87c325d11a5641d4718258a168a2849) - 2025-11-10

_Background stationarity, DOM gradient overlay, mouse-drag rotation._

### Features

- Add mouse drag rotation for blob mesh ([`81d8cb34`](https://github.com/kwami-labs/kwami/commit/81d8cb348d8606500d092fcd6a9386331cdf4f01))
- Smooth canvas resize during sidebar transitions (rAF loop) ([`e58ec12d`](https://github.com/kwami-labs/kwami/commit/e58ec12d0d35d7c57b61ca5e151b13ea6258cdee))
- Keep canvas centered and width-frozen during sidebar transitions; snap after animation ([`8b0f3f22`](https://github.com/kwami-labs/kwami/commit/8b0f3f2225106c733c15aa8dd1579cb7acd85886))
- Enhance scrollbar styling with custom positioning and kwami brand colors ([`a663a2d4`](https://github.com/kwami-labs/kwami/commit/a663a2d4bdc7fd44effcfab06d11ed92b6a45d5b))

### Bug Fixes

- Fix background rotation bug - lock backgrounds in world space ([`c5157c8e`](https://github.com/kwami-labs/kwami/commit/c5157c8ef9e7b92923dc1bb992ee4c94237908a9))
- Fix background rotation - keep background stationary in viewport ([`454723c6`](https://github.com/kwami-labs/kwami/commit/454723c66e043ae09b1f2772ecf76fb07506319d))
- Disable OrbitControls by default to keep backgrounds stationary ([`bf28f2dc`](https://github.com/kwami-labs/kwami/commit/bf28f2dc1b74b1e25df3abefe5f40c17a13c0440))
- Fix smooth resize and blob proportion when toggling sidebars ([`d74cdc8a`](https://github.com/kwami-labs/kwami/commit/d74cdc8a447b382d78a8ec1ca62a8cc7695066fe))
- Fix background plane scaling to cover full viewport ([`f48d7a35`](https://github.com/kwami-labs/kwami/commit/f48d7a35d9feb49e675a1283003209d5e8ab8d25))
- Fix gradient background to use scene.background instead of 3D plane ([`6f6e5eed`](https://github.com/kwami-labs/kwami/commit/6f6e5eed87b45e20309188326e51a9c1d8fd2bea))
- Fix gradient plane logic - force gradients to always use scene.background ([`cfbe7057`](https://github.com/kwami-labs/kwami/commit/cfbe7057bf1e1a09d1fd825ea1af225d6fca149b))
- Ensure canvas CSS size matches container during resize to prevent right-gap ([`bd971658`](https://github.com/kwami-labs/kwami/commit/bd97165840246507a26f542ab3423f913880a5a1))

### Refactoring

- Reorganize Body section Quick Variants ([`15098627`](https://github.com/kwami-labs/kwami/commit/15098627521bb4782f3176bf5e64784642e94f8e))

### Documentation

- Update README - simplify installation (dependencies included) ([`ca2c62b2`](https://github.com/kwami-labs/kwami/commit/ca2c62b2a91e9a10450bf5c4b212690eb3ba78cc))

### Styling

- Playground: render gradient via DOM overlay for bulletproof resize; Three.js background set transparent ([`78685d3a`](https://github.com/kwami-labs/kwami/commit/78685d3ab19fdcc5eb063a0b75e28d317b5c11e4))

### Chores

- Publish kwami to npm and update documentation ([`f17b3533`](https://github.com/kwami-labs/kwami/commit/f17b353397c7398ec619e8d3f8d182b709d91633))

### Other

- No canvas resize while closing menu; keep centered and frozen; only snap on reopen ([`a891b0c5`](https://github.com/kwami-labs/kwami/commit/a891b0c5f56b87d2b9bc3420c79eae5acd62bef8))

## [2.2.5](https://github.com/kwami-labs/kwami/commit/3968363154de698f1a347214a735d0c682b915cc) - 2025-11-05

_Render deployment / cache fixes._

### Chores

- Fix Render deployment with cache clearing and build optimization ([`35554ab8`](https://github.com/kwami-labs/kwami/commit/35554ab82eb93696d3fb40aa30fb395a46e6dc82))

### Other

- Merge dev v2.2.5 - Fix Render deployment ([`39683631`](https://github.com/kwami-labs/kwami/commit/3968363154de698f1a347214a735d0c682b915cc))

## [2.2.4](https://github.com/kwami-labs/kwami/commit/217f88b6ac3896eb797835e12f4115efcd1a48f2) - 2025-11-05

_Playground dark mode._

### Features

- Add ghost emoji favicon to playground ([`0191022d`](https://github.com/kwami-labs/kwami/commit/0191022d2d87875a07de6638e1fe5a2a38adbcd3))
- Fix favicon - use actual ghost emoji ([`590b01bb`](https://github.com/kwami-labs/kwami/commit/590b01bbef5a2a09303b5856d6a49ff0ddd480db))
- Debug and fix agent ID property handling ([`69e8aee1`](https://github.com/kwami-labs/kwami/commit/69e8aee1e03cdd8568f8069f785aaeb6e5c29e58))
- Add comprehensive agent ID detection ([`d58983ed`](https://github.com/kwami-labs/kwami/commit/d58983eddfd9f5bed82765523d7d6c38aaedcd43))
- Fix agent ID storage and retrieval for conversations ([`6e623fd9`](https://github.com/kwami-labs/kwami/commit/6e623fd9627eb58227f7742f36bfef73a81b08b2))
- Blob surface media + glass improvements ([`203b7afd`](https://github.com/kwami-labs/kwami/commit/203b7afdc005f28403d37ead15ebb3e03292655b))
- Add dark mode toggle to Kwami playground ([`90f7a571`](https://github.com/kwami-labs/kwami/commit/90f7a571529061edcd29510815c153d1739a45ce))

### Bug Fixes

- Fix agent selection and conversation start ([`8e54813f`](https://github.com/kwami-labs/kwami/commit/8e54813fd9d6e26a5fae2d881c873ed86d0bc04d))
- Fix agent ID undefined error when starting conversation ([`ac6bff51`](https://github.com/kwami-labs/kwami/commit/ac6bff51133f179de821ae4cf3f9edd6e3cfc6d8))
- Fix agent selection using index-based lookup ([`6a211788`](https://github.com/kwami-labs/kwami/commit/6a211788c63c74a25a41a19e83116496937ff1c7))
- Update Mind.ts and package dependencies ([`0707580b`](https://github.com/kwami-labs/kwami/commit/0707580b9a8a7538d983090204200719e83d4e1e))

### Styling

- UI: remove arrows from sidebar swap tabs ([`2d010049`](https://github.com/kwami-labs/kwami/commit/2d010049e42c43c8255c8081a83be9ca335b8774))

### Chores

- Add bun.lock for reproducible installs ([`cce925b7`](https://github.com/kwami-labs/kwami/commit/cce925b7afb1b3caf7987095ceff62f3964ad9cd))
- Minor updates to package.json and playground/index.html ([`a196d66a`](https://github.com/kwami-labs/kwami/commit/a196d66abcf351066208868414f257cd72bad781))

## [2.2.3](https://github.com/kwami-labs/kwami/commit/4ca500ee517e0b63582cde030b640ff75b54611e) - 2025-11-03

_Conversations API._

### Features

- Implement real glass effect via Three.js stencil ([`e1e945a7`](https://github.com/kwami-labs/kwami/commit/e1e945a7351a65b5e7aa260ffd0e2df0da48fe57))
- Make glass work without new UI: use existing 'Enable Glass Transparency' in Texture Blending ([`0b6c7860`](https://github.com/kwami-labs/kwami/commit/0b6c7860baa5d807d866cc56f98b39d64db1060f))
- Fix Random Gradient: use Body API (linear/radial), drop unsupported 'random spheres' overlay ([`cd41719e`](https://github.com/kwami-labs/kwami/commit/cd41719e171fd278f284d14f8a176343348cb20c))
- Glass toggle: preserve gradient; auto-set opacity to 0.8 only if it was 1.0 ([`23f21fc4`](https://github.com/kwami-labs/kwami/commit/23f21fc4167a7c354e36c6a82b82230128bf0476))
- Blob surface texture: render regardless of alpha ([`744a1526`](https://github.com/kwami-labs/kwami/commit/744a1526ffcc969a15d49ad98b1b0a02088a09a4))

### Documentation

- **changelog:** mini 2.2.2 entry – glass transparency + random gradient fixes ([`0632a42c`](https://github.com/kwami-labs/kwami/commit/0632a42c8acf624c1ef51c1daf0b7aa5e950901e))
- **changelog:** blob surface media + shader visibility fix under 2.2.2 ([`55d710e4`](https://github.com/kwami-labs/kwami/commit/55d710e4761b8373234578f88dbff562cee24950))

### Tests

- Glass toggle: adjust blob opacity (not background) to 0.8 only if it was 1.0; restore on disable ([`2a56173c`](https://github.com/kwami-labs/kwami/commit/2a56173cbbd2cd2c2cab459fb7459a301809dd94))

### Styling

- Blob Texture: implement image/video surface textures ([`7adbc00c`](https://github.com/kwami-labs/kwami/commit/7adbc00c7f26d30e906fdbd10ce0448903cd7658))

### Other

- Simplify glass mode: semi-transparent gradient + transparent blob ([`348d1bc0`](https://github.com/kwami-labs/kwami/commit/348d1bc00544cb8968067e140773841c2598402b))
- Remove broken glass transparency feature ([`d121e3fc`](https://github.com/kwami-labs/kwami/commit/d121e3fce4dd9ce0c9bd8f267c7a7a1bb89ad7f0))
- Release v2.2.3 - Conversations API ([`4ca500ee`](https://github.com/kwami-labs/kwami/commit/4ca500ee517e0b63582cde030b640ff75b54611e))

## [2.2.2](https://github.com/kwami-labs/kwami/commit/19dab7fa2d68a918966c1e927b745e8e6bf9d1e7) - 2025-11-03

_ElevenLabs Agents Management API; glass transparency & blob textures._

### Features

- Reorganize Body section: separate blob texture from background ([`7b3465f8`](https://github.com/kwami-labs/kwami/commit/7b3465f8cd31c19bbbdf6bc5246660eada158b0a))
- Restore glass mode: create window in gradient to reveal background ([`82a77fb4`](https://github.com/kwami-labs/kwami/commit/82a77fb427e3bad57f63c5e57aa9fcfeed830d2b))
- Fix glass mode: blob creates transparent window IN gradient ([`31308376`](https://github.com/kwami-labs/kwami/commit/31308376510089b413700f8075f4b676e74803f6))

### Bug Fixes

- Simplify blob texture controls: glass transparency only ([`550f83d2`](https://github.com/kwami-labs/kwami/commit/550f83d21d3f1d8b8ff458d941372ac74720c994))
- Fix glass transparency: don't change background gradient/image ([`72715d9c`](https://github.com/kwami-labs/kwami/commit/72715d9c2b1f448ed71a3c2c3160e86d4d946913))
- Undefined opacitySlider reference ([`0e20673c`](https://github.com/kwami-labs/kwami/commit/0e20673c11de6f94b91e506f078993b009ae1a91))
- Fix glass transparency: remove white layer, pure opacity only ([`987fb118`](https://github.com/kwami-labs/kwami/commit/987fb118e96383566c26cc280d7281f357dfc33b))
- Fix glass transparency: hide gradient to prevent white background ([`2a4603b6`](https://github.com/kwami-labs/kwami/commit/2a4603b6044a01151d382fbcd4c27d5baf98cc33))
- Fix glass effect: CSS mask creates transparent hole in gradient ([`eb0b2cd5`](https://github.com/kwami-labs/kwami/commit/eb0b2cd522632ed384d4233bb344d87ca6bafbbf))

### Documentation

- Glass transparency note: requires core implementation ([`ac28ad31`](https://github.com/kwami-labs/kwami/commit/ac28ad31ba74e610593c0dc2dbdc2ff512317aad))

### Styling

- Improve menu toggle and audio player behavior ([`6e07b4cc`](https://github.com/kwami-labs/kwami/commit/6e07b4cc18831aa326e7777745f7f4536907ea89))
- Redesign audio player toggle interaction ([`e087ec3d`](https://github.com/kwami-labs/kwami/commit/e087ec3dea48d00fc6b5a45845dcf794453ce2b6))

### Chores

- Release v2.2.2 - ElevenLabs Agents Management API ([`19dab7fa`](https://github.com/kwami-labs/kwami/commit/19dab7fa2d68a918966c1e927b745e8e6bf9d1e7))

## [2.2.1](https://github.com/kwami-labs/kwami/commit/26fa0c90604678dd3e420a75980450da8c7a0433) - 2025-11-02

_Automated version display._

### Features

- Add automatic version display system ([`21e73ef1`](https://github.com/kwami-labs/kwami/commit/21e73ef116465b2a8959b655ff6fb7c1d9bb47dd))

### Bug Fixes

- Fix navbar toggle functionality ([`3282cbae`](https://github.com/kwami-labs/kwami/commit/3282cbaed0855860f757b7203e70c80275c093dd))
- Release v2.2.1 - Automated version management ([`26fa0c90`](https://github.com/kwami-labs/kwami/commit/26fa0c90604678dd3e420a75980450da8c7a0433))

## [2.2.0](https://github.com/kwami-labs/kwami/commit/799be331f02f75a6a802e65d0187c1c3c95e35e1) - 2025-11-02

_Playground maturity line._

### Chores

- Release v2.2.0 ([`799be331`](https://github.com/kwami-labs/kwami/commit/799be331f02f75a6a802e65d0187c1c3c95e35e1))

## [2.1.0](https://github.com/kwami-labs/kwami/commit/4ecb47be5198c68a26ce7f487baee7e46ab7b3ac) - 2025-10-31

_Early playground line — WebSocket conversations & enhanced features._

### Features

- Update README.md ([`0b08dbab`](https://github.com/kwami-labs/kwami/commit/0b08dbab36735fadd08d827902a9ebf00155a3b3))
- Add ElevenLabs Mind & Soul integration with personality system ([`5d192b7f`](https://github.com/kwami-labs/kwami/commit/5d192b7f277d8fe649fc0ba6d6daf04e790c6946))
- Add interactive playground for local testing ([`9713055e`](https://github.com/kwami-labs/kwami/commit/9713055e1274672458d3bae38a9f96b762c943fa))
- Add comprehensive Body controls to playground ([`f4e2aa98`](https://github.com/kwami-labs/kwami/commit/f4e2aa986b94b0581747d19defbaaadfab012262))
- Add dual sidebar layout with background gradient controls ([`498495f7`](https://github.com/kwami-labs/kwami/commit/498495f74777234a64986d58db88b0a038a7484f))
- Add background configuration API ([`9c6bda7b`](https://github.com/kwami-labs/kwami/commit/9c6bda7b25d83b2d490d4a0c34f1e94783944c05))
- Integrate background controls in playground ([`c0411c44`](https://github.com/kwami-labs/kwami/commit/c0411c446c5f6afb6fd3307b74dbc143b7443d12))
- Add camera position controls to playground ([`c8274249`](https://github.com/kwami-labs/kwami/commit/c827424993b49316e0607587540314758c3bc0be))
- Enhance blob animation and visuals ([`c44404ba`](https://github.com/kwami-labs/kwami/commit/c44404ba0362e67c766f08cf7191b42eb401c7c2))
- Update playground default values ([`a32d8ff8`](https://github.com/kwami-labs/kwami/commit/a32d8ff869203db28f83158c4c779f37c2ec6c7c))
- Enhance blob randomization ranges ([`f1ef0637`](https://github.com/kwami-labs/kwami/commit/f1ef0637b32f6ed44f72876e9badad79aebd1206))
- Add Tricolor2 (Donut) skin ([`6e98d139`](https://github.com/kwami-labs/kwami/commit/6e98d139430273405ad1aeb925b3df78a81612ae))
- Add background image support ([`63a21a57`](https://github.com/kwami-labs/kwami/commit/63a21a577a4683db702c34814f458f18f0f90492))
- Improve playground UX and functionality ([`3f36ba5e`](https://github.com/kwami-labs/kwami/commit/3f36ba5e1e124a7e5ca5a124477bfa8d77f32c3e))
- Add more background images ([`c75a1753`](https://github.com/kwami-labs/kwami/commit/c75a17539647e6a2d0436a928fe1b28d2e15ac5f))
- Enhance skin switching and shininess ([`c9acb95f`](https://github.com/kwami-labs/kwami/commit/c9acb95f0c135671656a0d3205cd95b2b8253dde))
- Improve playground defaults and camera behavior ([`74c13a98`](https://github.com/kwami-labs/kwami/commit/74c13a9891d5494ac70ad7ea075e3f445c82521d))
- Add dynamic tricolor lighting system ([`099a52ea`](https://github.com/kwami-labs/kwami/commit/099a52eab2eff8c9e455c5b8979f9aa133cf47bb))
- Add fluid click interaction with configurable touch effects ([`822923f3`](https://github.com/kwami-labs/kwami/commit/822923f3352a63289c443b9c948e14ff7c921676))
- Add microphone listening support ([`243e9489`](https://github.com/kwami-labs/kwami/commit/243e94899273bbe7b97fe246b9322334b65334c1))
- Add smooth state transitions between all animation modes ([`474dfc8b`](https://github.com/kwami-labs/kwami/commit/474dfc8bc7340ae289dae4315bb47f0ec9b11f14))
- Add comprehensive animation configuration UI ([`84437b50`](https://github.com/kwami-labs/kwami/commit/84437b50d790c0cc1e0ae75eb4f4fb606ddc2ddd))
- Minor improvements to animation system ([`8cc9f173`](https://github.com/kwami-labs/kwami/commit/8cc9f173271f8864d57d5ccb5dc00d59b5739845))
- Expose animation configuration parameters ([`ace51c4d`](https://github.com/kwami-labs/kwami/commit/ace51c4d54962add65448e2945094456667739a0))
- Add audio player UI to playground + formatting improvements ([`954a40a4`](https://github.com/kwami-labs/kwami/commit/954a40a42f76b88982faa8f77ce80ea3b4f7543c))
- Assets: add new background images for playground ([`00ac249c`](https://github.com/kwami-labs/kwami/commit/00ac249c3c5fe6d60444e138e9cf5387295b6cc3))
- Add audio effects configuration to playground UI ([`1f30184e`](https://github.com/kwami-labs/kwami/commit/1f30184ef271d0a6cf71f6462484e67db393e906))
- Implement configurable audio effects system ([`598d0199`](https://github.com/kwami-labs/kwami/commit/598d01999aae63bc43a35202ceacb2997e0c419e))
- Add timeEnabled flag for audio effects ([`000dd289`](https://github.com/kwami-labs/kwami/commit/000dd28909c0d53c59897b7e54b1e18cb5da439b))
- Enhance Mind menu with comprehensive voice configuration ([`8b6202fa`](https://github.com/kwami-labs/kwami/commit/8b6202fa6e300c3917363901ff09888da0d868a8))
- Implement comprehensive Mind menu functionality ([`009db128`](https://github.com/kwami-labs/kwami/commit/009db1288523fbcc32d37c5ece90ee70d3413bee))
- Implement viscous fluid dynamics for blob animation ([`56491422`](https://github.com/kwami-labs/kwami/commit/56491422b352ab74b6ecf9b9e04a72c9df272f01))
- Shader and blob animation enhancements ([`cb7378ed`](https://github.com/kwami-labs/kwami/commit/cb7378ed8925233a627cb9a53414df9d7da1a460))
- UI: Add options for blob transparency and adjust touch duration ([`0084ba46`](https://github.com/kwami-labs/kwami/commit/0084ba465219e27a6ae4ced45023e62f641b18b4))
- **playground:** add gradient angle and color stop controls to background menu ([`fd0f1b5d`](https://github.com/kwami-labs/kwami/commit/fd0f1b5dd4e31b5c84995670ce948eb23a422709))
- Add blob transparency options and glass mode ([`2caf7298`](https://github.com/kwami-labs/kwami/commit/2caf729852f30facb46b0b67d335f1686fc89851))

### Bug Fixes

- Add debug logging for scale functionality ([`1860d97b`](https://github.com/kwami-labs/kwami/commit/1860d97bbadd2bee43c94b4e48fcd3db8176a31f))
- Fix scale slider - preserve user scale during animation ([`95caa3e7`](https://github.com/kwami-labs/kwami/commit/95caa3e794447af7604cd67b59409b28975a7c43))
- Fix Mind initialization ([`ef485f30`](https://github.com/kwami-labs/kwami/commit/ef485f304d6047f4ab3d3e4543c6188d27aae642))
- Improve animation stability & prevent geometry collapse ([`0a47247b`](https://github.com/kwami-labs/kwami/commit/0a47247ba38f8ba05377a5d09c470741086c32e7))
- Wire audio effects controls to blob properties ([`9b6bbabd`](https://github.com/kwami-labs/kwami/commit/9b6bbabd9ad22463c1162532afc24ef36234c4b5))
- Remove white background from state badges ([`01f31622`](https://github.com/kwami-labs/kwami/commit/01f3162212e61683fa1302f6c900ef811b5be2a8))
- Remove debug logging and update documentation ([`3313999b`](https://github.com/kwami-labs/kwami/commit/3313999b82825e0138cf46e38eb191a87d4d1dfc))
- Minor updates to Body.ts for improved type handling ([`4bbe8a6b`](https://github.com/kwami-labs/kwami/commit/4bbe8a6b7694c299cdd83a6257f5f8fc225f498d))
- Add Vite config to properly bundle background images for production ([`f8e8278c`](https://github.com/kwami-labs/kwami/commit/f8e8278c9f273217f1beefe0374340881143d0eb))
- Use absolute paths for background images to work in both dev and production ([`93e3609e`](https://github.com/kwami-labs/kwami/commit/93e3609e69bc2cfe3fb34fec377ee25e8b7aad6d))
- Resolve state indicator initialization error ([`a5f6b594`](https://github.com/kwami-labs/kwami/commit/a5f6b594a6adecf4177feb36cf997bda86d76cca))
- Correct image paths for playground assets ([`e5ee06ea`](https://github.com/kwami-labs/kwami/commit/e5ee06ea0779924a55680e439c935dec304a2702))
- Correct shininess behavior in blob shaders ([`93a494e4`](https://github.com/kwami-labs/kwami/commit/93a494e42c5aad748d7e7b0cc759a9261a1e086d))

### Refactoring

- Refactor playground: extract CSS and JS to separate files ([`980a9b87`](https://github.com/kwami-labs/kwami/commit/980a9b87d019ba38119cdb1257a39e18d18f0d5f))
- Move all messages below kwami blob ([`ca4f7047`](https://github.com/kwami-labs/kwami/commit/ca4f7047752ce39392ead23be0e1d6294e8b7a39))
- Updates to playground and core mind functionality ([`8c967e27`](https://github.com/kwami-labs/kwami/commit/8c967e27caa37e4d5de949b4f45340e81f1fb7e9))
- Move playground functionality to core library classes ([`c28a3675`](https://github.com/kwami-labs/kwami/commit/c28a36758b98ec73f23a44aa2edf7e4eaaef50de))

### Documentation

- Add dual license and runtime support docs ([`6c14d285`](https://github.com/kwami-labs/kwami/commit/6c14d285b69b8302d265a0d8809951a591ab28ab))
- Add quick start guide for easy onboarding ([`d5b24ae3`](https://github.com/kwami-labs/kwami/commit/d5b24ae3e31252ea30f06bad44a8b0a147dd498e))
- Reorganize documentation into docs/ folder ([`62e7a3d1`](https://github.com/kwami-labs/kwami/commit/62e7a3d1d975e9322963a8d328b0f4f174ea248b))
- Update documentation to reflect Mind and Soul implementation ([`2a68369d`](https://github.com/kwami-labs/kwami/commit/2a68369d211c6f7cdd324b1457e379864f936f5c))
- Update documentation ([`064a1729`](https://github.com/kwami-labs/kwami/commit/064a172937453130356aaebfd6fb3c6514b69782))
- Comprehensive update for interactive animations & state system ([`e914af64`](https://github.com/kwami-labs/kwami/commit/e914af649b2c938544a3aec04a0d41cd415972b0))
- Comprehensive update for all recent features ([`06ae9225`](https://github.com/kwami-labs/kwami/commit/06ae922571f58e01fa08b8299a8c549274ca230c))
- Add comprehensive Mind menu documentation ([`0db87494`](https://github.com/kwami-labs/kwami/commit/0db8749403a70f63d27227d22052072ae8df7a75))
- Update documentation with latest features ([`ab857b43`](https://github.com/kwami-labs/kwami/commit/ab857b4356ee21c196b439ab088a994582fbb09b))
- Add and update mind menu class implementation guides ([`ee613ac4`](https://github.com/kwami-labs/kwami/commit/ee613ac4ef3475cc8145d4b9d542eef14c6f7039))
- Update documentation and shader improvements ([`d14b44e7`](https://github.com/kwami-labs/kwami/commit/d14b44e7914ba3b9298fdbfdd43de4f978012058))
- Update documentation: CHANGELOG & README ([`143bd215`](https://github.com/kwami-labs/kwami/commit/143bd21529ab1986a85537a3a21ee23b72e2834d))
- _…and 1 more (see git history)_

### Styling

- Redesign playground UI layout ([`65a53ca5`](https://github.com/kwami-labs/kwami/commit/65a53ca565444596d72d9995a79d658f6a2a0a5d))
- Enhance zebra skin with tricolor support ([`b1e12eff`](https://github.com/kwami-labs/kwami/commit/b1e12eff0e91d179bfa7a2a7aa4e5f7fc8e03408))
- Add parameter-info class for descriptive text ([`a99c82d5`](https://github.com/kwami-labs/kwami/commit/a99c82d5fa0929680b478fdf1d00dd806e38303d))
- Improve badge and button contrast for better readability ([`599f4b74`](https://github.com/kwami-labs/kwami/commit/599f4b74292aa47c4515ae30f91106e1e430f96b))
- Simplify badges with solid backgrounds and smaller size ([`e4d5f892`](https://github.com/kwami-labs/kwami/commit/e4d5f89242dd4e227376ca0256e4818cda6c32a1))

### Chores

- Major documentation upgrade: Comprehensive CHANGELOG & README ([`f2821219`](https://github.com/kwami-labs/kwami/commit/f28212197d9c5b327d45046b2e96607f5f912b80))
- Setup production deployment & dev workflow ([`ae239f24`](https://github.com/kwami-labs/kwami/commit/ae239f242e96619277c99f9d340988e259004564))
- Release v2.1.0 - WebSocket Conversations & Enhanced Features ([`4ecb47be`](https://github.com/kwami-labs/kwami/commit/4ecb47be5198c68a26ce7f487baee7e46ab7b3ac))

### Other

- Update project title emoji in README ([`1fa5d6c4`](https://github.com/kwami-labs/kwami/commit/1fa5d6c4bfa5d4efc24f0a0b0b8efd9387bb57bd))
- Update ARCHITECTURE.md with complete Mind & Soul integration ([`66206bfa`](https://github.com/kwami-labs/kwami/commit/66206bfa2d3efbde733e3e631792f8444e1916db))
- Move .env.sample to playground directory ([`f3dafbf3`](https://github.com/kwami-labs/kwami/commit/f3dafbf322fbe9d6613a064d6f283f854e5c714b))
- Implement functional camera position controls ([`59ed2002`](https://github.com/kwami-labs/kwami/commit/59ed20023158e44a1d253d3d89001c4f71a4b300))
- Add rotating sidebar system with Soul configuration ([`b5a7a69e`](https://github.com/kwami-labs/kwami/commit/b5a7a69ec7446e7e987fd7c76f5049b8a6914bfe))
- Final updates: playground enhancements, Mind.ts improvements, and ElevenLabs setup guide ([`5e09011a`](https://github.com/kwami-labs/kwami/commit/5e09011a1e2cd911c6300745b0b54a6e0caa620a))
- Remove unused assets/textures/index.ts ([`3a982257`](https://github.com/kwami-labs/kwami/commit/3a98225700beeb92f43fdf52262b3e0292e19772))

## [2.0.0](https://github.com/kwami-labs/kwami/commit/38c8a363568a90959ae6c6866bc3664e54ce073f) - 2025-10-20

_Original playground-era core library (Mind / Body / Soul)._

### Features

- Add kwami v2.0.0 core library ([`38c8a363`](https://github.com/kwami-labs/kwami/commit/38c8a363568a90959ae6c6866bc3664e54ce073f))
