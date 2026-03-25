import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="py-12 bg-white dark:bg-[#0f172a] min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Liên hệ</h1>
          <p className="text-gray-500">Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            {[
              { icon: MapPin, title: 'Địa chỉ', text: 'Tòa nhà FPT Polytechnic, Trịnh Văn Bô, Nam Từ Liêm, Hà Nội' },
              { icon: Phone, title: 'Điện thoại', text: '0123 456 789' },
              { icon: Mail, title: 'Email', text: 'contact@rudowatch.store' },
              { icon: Clock, title: 'Giờ làm việc', text: 'Thứ 2 - Thứ 7: 8:00 - 21:00' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-blue-600" /></div>
                <div><h3 className="font-semibold mb-1">{title}</h3><p className="text-sm text-gray-500">{text}</p></div>
              </div>
            ))}
          </div>
          <form className="space-y-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1.5">Họ tên</label><input type="text" className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nguyễn Văn A" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Email</label><input type="email" className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="your@email.com" /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1.5">Tiêu đề</label><input type="text" className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tiêu đề tin nhắn" /></div>
            <div><label className="block text-sm font-medium mb-1.5">Nội dung</label><textarea rows={5} className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Nội dung tin nhắn..." /></div>
            <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors">Gửi tin nhắn</button>
          </form>
        </div>
      </div>
    </div>
  );
}
