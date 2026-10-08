'use client';

import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { Icon } from '@astryxdesign/core/Icon';
import { toBlob } from 'html-to-image';
import { Camera, Copy, Download } from 'lucide-react';
import { useState } from 'react';

import { useAppToast } from '@/shared/hooks/use-app-toast.js';

/**
 * Cells marked with this attribute (e.g. a row-actions column) are left out
 * of the picture. Mark the header, body and footer cell of the column alike
 * so the captured table keeps its column alignment.
 */
export const SCREENSHOT_EXCLUDE_ATTRIBUTE = 'data-screenshot-exclude';

/**
 * Renders `element` to a PNG at 2× for a crisp paste into chat / email.
 * The table is captured at its full size even while its scroller shows
 * only part of it.
 * @param {HTMLElement} element
 * @returns {Promise<Blob>}
 */
async function captureElement(element) {
  const blob = await toBlob(element, {
    pixelRatio: 2,
    // A table is transparent over its card; paint the card's surface
    // behind it so the PNG isn't see-through in chat apps.
    backgroundColor:
      getComputedStyle(element)
        .getPropertyValue('--color-background-surface')
        .trim() || undefined,
    width: element.scrollWidth,
    height: element.scrollHeight,
    filter: (node) =>
      !(
        node instanceof HTMLElement &&
        node.hasAttribute(SCREENSHOT_EXCLUDE_ATTRIBUTE)
      ),
  });
  if (!blob) throw new Error('Không tạo được ảnh.');
  return blob;
}

/**
 * Puts the PNG on the clipboard; false where the browser has no image
 * clipboard or refuses the write (plain-HTTP origin, denied permission).
 * @param {Promise<Blob>} image
 * @returns {Promise<boolean>}
 */
async function copyImage(image) {
  if (
    typeof ClipboardItem === 'undefined' ||
    typeof navigator.clipboard?.write !== 'function'
  ) {
    return false;
  }
  try {
    // Hand the clipboard the promise so the write keeps the click's user
    // activation while the image renders (Safari requires this).
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': image }),
    ]);
    return true;
  } catch {
    return false;
  }
}

/** @param {Blob} blob @param {string} fileName */
function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.png`;
  link.click();
  // Revoking in the same task cancels the download before Chrome reads it.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * "Chụp bảng" menu button: copies a PNG of the target element (usually a
 * `<table>`) to the clipboard, or downloads it. Falls back to a download
 * where the browser has no image clipboard (e.g. plain-HTTP origins).
 * @param {{
 *   targetRef: import('react').RefObject<HTMLElement | null>,
 *   fileName: string,
 *   isDisabled?: boolean,
 * }} props
 */
export function TableScreenshotButton({
  targetRef,
  fileName,
  isDisabled = false,
}) {
  const toast = useAppToast();
  const [isCapturing, setIsCapturing] = useState(false);

  /** @param {'copy' | 'download'} mode */
  async function capture(mode) {
    const element = targetRef.current;
    if (!element) return;
    setIsCapturing(true);
    try {
      // One render, shared by the clipboard attempt and the download
      // fallback.
      const image = captureElement(element);
      if (mode === 'copy' && (await copyImage(image))) {
        toast({ body: 'Đã sao chép ảnh bảng — dán (Ctrl + V) để gửi.' });
        return;
      }
      downloadBlob(await image, fileName);
      toast(
        mode === 'copy'
          ? {
              body: 'Trình duyệt không cho sao chép ảnh — đã tải ảnh về máy.',
              type: 'info',
            }
          : { body: 'Đã tải ảnh bảng về máy.' },
      );
    } catch {
      toast({ body: 'Không chụp được bảng. Vui lòng thử lại.', type: 'error' });
    } finally {
      setIsCapturing(false);
    }
  }

  return (
    <DropdownMenu
      button={{
        label: 'Chụp bảng',
        variant: 'secondary',
        icon: <Icon icon={Camera} size="sm" />,
        isDisabled: isDisabled || isCapturing,
      }}
      alignment="end"
      menuWidth="max-content"
      items={[
        {
          id: 'copy',
          label: 'Sao chép ảnh',
          icon: <Icon icon={Copy} size="sm" />,
          onClick: () => capture('copy'),
        },
        {
          id: 'download',
          label: 'Tải ảnh (PNG)',
          icon: <Icon icon={Download} size="sm" />,
          onClick: () => capture('download'),
        },
      ]}
    />
  );
}
