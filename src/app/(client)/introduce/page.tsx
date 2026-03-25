import { Shield, Truck, Award, Headphones } from 'lucide-react';

export default function IntroducePage() {
  const features = [
    { icon: Shield, title: 'Chính hãng 100%', desc: 'Cam kết sản phẩm chính hãng từ nhà phân phối' },
    { icon: Truck, title: 'Giao hàng nhanh', desc: 'Miễn phí vận chuyển cho đơn hàng trên 2 triệu' },
    { icon: Award, title: 'Bảo hành uy tín', desc: 'Bảo hành chính hãng theo quy định nhà sản xuất' },
    { icon: Headphones, title: 'Hỗ trợ 24/7', desc: 'Đội ngũ tư vấn sẵn sàng hỗ trợ mọi lúc' },
  ];

  return (
    <div className="py-12 bg-white dark:bg-[#0f172a] min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Về Rudo Watch</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">Rudo Watch là cửa hàng đồng hồ chính hãng hàng đầu Việt Nam, chuyên cung cấp các mẫu đồng hồ cao cấp từ những thương hiệu nổi tiếng thế giới.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center p-6 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4"><Icon className="w-6 h-6 text-blue-600" /></div>
              <h3 className="font-bold mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
        <div className="prose dark:prose-invert max-w-3xl mx-auto">
          <h2>Câu chuyện của chúng tôi</h2>
          <p>Rudo Watch được thành lập với sứ mệnh mang đến cho khách hàng Việt Nam những chiếc đồng hồ chính hãng, chất lượng cao với mức giá hợp lý nhất. Chúng tôi tin rằng mỗi chiếc đồng hồ không chỉ là một công cụ xem giờ mà còn là một phụ kiện thể hiện phong cách và đẳng cấp.</p>
          <p>Với đội ngũ nhân viên giàu kinh nghiệm và đam mê, chúng tôi cam kết mang đến trải nghiệm mua sắm tuyệt vời nhất cho khách hàng.</p>
        </div>
      </div>
    </div>
  );
}
