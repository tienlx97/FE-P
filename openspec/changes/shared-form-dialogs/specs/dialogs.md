# Dialog behavior

- Production forms share a visible header, one content scroll owner and visible save/cancel actions. Narrow screens fit the viewport; compact forms remain compact on desktop.
- Closing a changed form asks before discarding. Escape cancels confirmation. While any part of submission is pending, a second save or closing is blocked.
- Quick-create dialogs have independent forms: Enter saves only the child, never the parent. Closing a child preserves its parent's draft.
- Validation shows a summary, opens the section/tab containing errors, and makes the first invalid control reachable.
- Shipment VGM is unavailable before saving a Shipment; logistics costs remain editable in creation. Tab switching preserves drafts.
- User detail/bank loading failures offer retry and block save. Loading server defaults must not mark a clean form dirty. Permission/session actions remain explicit independent operations.
