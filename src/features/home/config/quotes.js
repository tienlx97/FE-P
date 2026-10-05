/** @typedef {{text:string, author:string}} Quote */

// Quote of the day for the Home calendar: witty and work-relevant quotes from
// well-known people (our own Vietnamese renderings) mixed with folk proverbs.
// Order is deliberate so neighbouring days alternate in tone.
const QUOTES = /** @type {Quote[]} */ ([
  {
    text: 'Tôi không thất bại. Tôi chỉ vừa tìm ra 10.000 cách không hiệu quả.',
    author: 'Thomas Edison',
  },
  { text: 'Đi một ngày đàng, học một sàng khôn.', author: 'Tục ngữ Việt Nam' },
  { text: 'Bí quyết để tiến lên là bắt đầu.', author: 'Mark Twain' },
  { text: 'Hành trình vạn dặm bắt đầu từ một bước chân.', author: 'Lão Tử' },
  {
    text: 'Đừng đếm ngày trôi qua, hãy làm cho mỗi ngày đáng đếm.',
    author: 'Muhammad Ali',
  },
  { text: 'Kiến tha lâu cũng đầy tổ.', author: 'Tục ngữ Việt Nam' },
  {
    text: 'Lập kế hoạch thì vô giá, còn bản kế hoạch thì chẳng đáng là bao.',
    author: 'Dwight D. Eisenhower',
  },
  {
    text: 'Không quan trọng bạn đi chậm thế nào, miễn là đừng dừng lại.',
    author: 'Khổng Tử',
  },
  {
    text: 'Thời gian là thứ ta muốn có nhiều nhất nhưng lại dùng tệ nhất.',
    author: 'William Penn',
  },
  { text: 'Chớ thấy sóng cả mà ngã tay chèo.', author: 'Tục ngữ Việt Nam' },
  {
    text: 'Hai mươi năm nữa, bạn sẽ tiếc những việc mình đã không làm hơn là những việc đã làm. Vậy hãy tháo dây neo, rời bến đỗ.',
    author: 'Mark Twain',
  },
  {
    text: 'Cuộc sống giống như đi xe đạp. Muốn giữ thăng bằng, bạn phải tiếp tục tiến lên.',
    author: 'Albert Einstein',
  },
  {
    text: 'Đầu tư vào tri thức luôn sinh lời cao nhất.',
    author: 'Benjamin Franklin',
  },
  { text: 'Cẩn tắc vô áy náy.', author: 'Tục ngữ Việt Nam' },
  {
    text: 'Ta không thể đổi hướng gió, nhưng có thể chỉnh lại cánh buồm.',
    author: 'Ngạn ngữ phương Tây',
  },
  {
    text: 'Tôi yêu những hạn chót. Tôi thích cái tiếng vù vù chúng tạo ra khi bay vụt qua.',
    author: 'Douglas Adams',
  },
  { text: 'May mắn là khi sự chuẩn bị gặp được cơ hội.', author: 'Seneca' },
  {
    text: 'Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.',
    author: 'Ca dao Việt Nam',
  },
  {
    text: 'Đến với nhau là khởi đầu, giữ được nhau là tiến bộ, cùng nhau làm việc là thành công.',
    author: 'Henry Ford',
  },
  {
    text: 'Hãy làm điều bạn có thể, với những gì bạn có, ở nơi bạn đang đứng.',
    author: 'Theodore Roosevelt',
  },
  {
    text: 'Lời nói chẳng mất tiền mua, lựa lời mà nói cho vừa lòng nhau.',
    author: 'Ca dao Việt Nam',
  },
  {
    text: 'Người bi quan thấy khó khăn trong mỗi cơ hội; người lạc quan thấy cơ hội trong mỗi khó khăn.',
    author: 'Winston Churchill',
  },
  { text: 'Đơn giản là đỉnh cao của sự tinh tế.', author: 'Leonardo da Vinci' },
  { text: 'Có công mài sắt, có ngày nên kim.', author: 'Tục ngữ Việt Nam' },
  {
    text: 'Nếu bạn nghĩ mình làm được, hay nghĩ mình không làm được — bạn đều đúng.',
    author: 'Henry Ford',
  },
  {
    text: 'Công việc luôn phình ra cho đến khi lấp đầy thời gian được giao để hoàn thành nó.',
    author: 'Định luật Parkinson',
  },
  {
    text: 'Không có gió thuận cho con thuyền không biết mình đi đâu.',
    author: 'Seneca',
  },
  { text: 'Lửa thử vàng, gian nan thử sức.', author: 'Tục ngữ Việt Nam' },
  {
    text: 'Đừng bao giờ để đến ngày mai việc có thể làm ngày kia.',
    author: 'Mark Twain',
  },
  {
    text: 'Thành công thường đến với người bận rộn đến mức không có thời gian tìm kiếm nó.',
    author: 'Henry David Thoreau',
  },
  { text: 'Biết người biết ta, trăm trận trăm thắng.', author: 'Tôn Tử' },
  {
    text: 'Nếu bạn không thể giải thích đơn giản, nghĩa là bạn chưa hiểu đủ rõ.',
    author: 'Albert Einstein',
  },
  {
    text: 'Cơ hội thường bị bỏ lỡ vì nó mặc quần áo lao động và trông giống công việc.',
    author: 'Thomas Edison',
  },
  { text: 'Buôn có bạn, bán có phường.', author: 'Tục ngữ Việt Nam' },
  {
    text: 'Chúng ta là những gì ta lặp đi lặp lại. Xuất sắc không phải hành động, mà là thói quen.',
    author: 'Will Durant',
  },
  {
    text: 'Hạnh phúc không phải thứ làm sẵn. Nó đến từ chính hành động của bạn.',
    author: 'Đạt Lai Lạt Ma',
  },
  {
    text: 'Muốn biết phải hỏi, muốn giỏi phải học.',
    author: 'Tục ngữ Việt Nam',
  },
  {
    text: 'Người khôn học từ sai lầm của mình; người khôn hơn học từ sai lầm của người khác.',
    author: 'Otto von Bismarck',
  },
  {
    text: 'Hôm nay là ngày mai mà hôm qua bạn từng lo lắng.',
    author: 'Dale Carnegie',
  },
  { text: 'Nước chảy đá mòn.', author: 'Tục ngữ Việt Nam' },
  {
    text: 'Ai cũng muốn thay đổi thế giới, nhưng chẳng ai nghĩ đến việc thay đổi chính mình.',
    author: 'Lev Tolstoy',
  },
  {
    text: 'Muốn đi nhanh, hãy đi một mình. Muốn đi xa, hãy đi cùng nhau.',
    author: 'Ngạn ngữ châu Phi',
  },
  { text: 'Khéo ăn thì no, khéo co thì ấm.', author: 'Tục ngữ Việt Nam' },
  {
    text: 'Năng suất không phải là làm nhiều việc hơn, mà là làm đúng việc.',
    author: 'Peter Drucker',
  },
  {
    text: 'Thời điểm tốt nhất để trồng cây là 20 năm trước. Thời điểm tốt thứ hai là bây giờ.',
    author: 'Ngạn ngữ Trung Hoa',
  },
  {
    text: 'Ngọc không mài không sáng, người không học không hay.',
    author: 'Tục ngữ Việt Nam',
  },
  {
    text: 'Tôi chưa bao giờ làm việc một ngày nào trong đời. Tất cả chỉ là niềm vui.',
    author: 'Thomas Edison',
  },
  {
    text: 'Bạn bỏ lỡ một trăm phần trăm những cú sút mà bạn không thực hiện.',
    author: 'Wayne Gretzky',
  },
  { text: 'Gần mực thì đen, gần đèn thì rạng.', author: 'Tục ngữ Việt Nam' },
  {
    text: 'Kiên nhẫn là đắng, nhưng quả của nó thì ngọt.',
    author: 'Jean-Jacques Rousseau',
  },
  {
    text: 'Sự hoàn hảo đạt được không phải khi chẳng còn gì để thêm, mà khi chẳng còn gì để bớt.',
    author: 'Antoine de Saint-Exupéry',
  },
  { text: 'Uống nước nhớ nguồn.', author: 'Tục ngữ Việt Nam' },
  {
    text: 'Cái gì có thể hỏng thì sẽ hỏng — nên hãy kiểm tra lại chứng từ.',
    author: 'Định luật Murphy (bản logistics)',
  },
  {
    text: 'Điều duy nhất ta phải sợ là chính nỗi sợ hãi.',
    author: 'Franklin D. Roosevelt',
  },
  {
    text: 'Nói lời phải giữ lấy lời, đừng như con bướm đậu rồi lại bay.',
    author: 'Ca dao Việt Nam',
  },
  {
    text: 'Không có việc gì khó, chỉ sợ lòng không bền.',
    author: 'Hồ Chí Minh',
  },
  { text: 'Hãy luôn khát khao, hãy cứ dại khờ.', author: 'Steve Jobs' },
  { text: 'Một con ngựa đau, cả tàu bỏ cỏ.', author: 'Tục ngữ Việt Nam' },
  {
    text: 'Làm việc chăm chỉ trong im lặng, để thành công tự lên tiếng.',
    author: 'Khuyết danh',
  },
  {
    text: 'Đừng xấu hổ khi không biết, chỉ xấu hổ khi không học.',
    author: 'Ngạn ngữ Nga',
  },
]);

/** Quote for a day: stable all day, a different one the next day.
 * @param {number} jd Julian day number of the Vietnam date */
export function dailyQuote(jd) {
  return QUOTES[jd % QUOTES.length];
}

export const QUOTE_COUNT = QUOTES.length;
