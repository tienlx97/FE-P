/**
 * @typedef {{
 *   id: string,
 *   kind?: 'holiday',
 *   date: string,
 *   time: string | null,
 *   title: string,
 *   location: string,
 *   audience: string,
 *   image: { src: string, width: number, height: number, alt: string },
 * }} CompanyEvent
 */

/**
 * Upcoming internal events shown on the home page. `date` is an ISO
 * `YYYY-MM-DD` string; `time` is `HH:mm` or `null` for an all-day event.
 * `audience` says who is expected to attend, which is the first thing an
 * employee scanning the list actually needs. `image` points at a file under
 * `public/images/home/`.
 *
 * Placeholder entries until a real events/calendar source exists — same
 * pattern as `news.js` and `companies.js`.
 * @type {CompanyEvent[]}
 */
export const events = [
  {
    id: 'hop-giao-ban-thang',
    date: '2026-08-20',
    time: '08:30',
    title: 'Họp giao ban đầu tháng',
    location: 'Phòng họp tầng 3, Trụ sở chính',
    audience: 'Trưởng các bộ phận',
    image: {
      src: '/images/home/event-1.jpg',
      width: 600,
      height: 400,
      alt: 'Phòng họp với các đồng nghiệp đang trao đổi',
    },
  },
  {
    id: 'dao-tao-an-toan-lao-dong',
    date: '2026-08-25',
    time: '13:30',
    title: 'Đào tạo an toàn lao động định kỳ',
    location: 'Nhà máy Cơ khí Đại Nghĩa',
    audience: 'Toàn bộ khối sản xuất',
    image: {
      src: '/images/home/event-2.jpg',
      width: 600,
      height: 400,
      alt: 'Buổi đào tạo trong xưởng sản xuất',
    },
  },
  {
    id: 'nghi-le-quoc-khanh',
    kind: 'holiday',
    date: '2026-09-02',
    time: null,
    title: 'Nghỉ lễ Quốc khánh 2/9',
    location: 'Toàn hệ sinh thái',
    audience: 'Toàn thể cán bộ nhân viên',
    image: {
      src: '/images/home/event-3.jpg',
      width: 600,
      height: 400,
      alt: 'Toàn cảnh thành phố nhìn từ trên cao',
    },
  },
  {
    id: 'tong-ket-quy-3',
    date: '2026-09-30',
    time: '14:00',
    title: 'Tổng kết hoạt động quý 3',
    location: 'Hội trường lớn, Trụ sở chính',
    audience: 'Toàn thể cán bộ nhân viên',
    image: {
      src: '/images/home/event-4.jpg',
      width: 600,
      height: 400,
      alt: 'Nhóm đồng nghiệp làm việc cùng nhau',
    },
  },
];
