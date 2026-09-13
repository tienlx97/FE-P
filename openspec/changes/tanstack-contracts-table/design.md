# Design

TanStack Table v8.21.3 owns row/column models in a shared renderer. The
contracts list opts in through headerGroups; other consumers of AdvanceTable
retain the existing data-driven renderer. Astryx Table is used in children
mode purely for styling/semantic primitives, preserving theme, density,
borders and filter popovers. No new visual design system is introduced.

The existing controlled toolbar continues to supply column order, visibility,
pinning and already-filtered API page data. manualPagination/manualFiltering
avoid paginating a server page twice. The component opts out of React Compiler
memoization for the v8 instance. Proportional widths resolve into exact pixels
on ResizeObserver changes, so pinned offsets match actual column widths.

Real grouped headers replace the former measured overlay. Existing fixed
viewport totals retain their behavior, with opaque pinned cells and computed
text alignment. Native colgroup is allowed for TanStack column sizing; all
visible chrome continues to use Astryx and StyleX.
