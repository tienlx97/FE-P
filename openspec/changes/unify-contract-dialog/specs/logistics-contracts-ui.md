# Contract workspace

- Clicking a contract opens its information in the fullscreen workspace; editing stays in the same dialog.
- Creation shows all four tabs. Only Information is enabled; the other three explain that the contract must be saved first.
- Saving creates/updates once, keeps the workspace open in view mode using the returned record and enables related tabs. Failed validation/save preserves the draft.
- Switching tabs during edit preserves draft fields. Cancel/close with changes asks before discarding; saving blocks closing.
- Header/tabs and footer stay visible while content scrolls. Tabs scroll on narrow screens. Related editors remain outside table rendering.
