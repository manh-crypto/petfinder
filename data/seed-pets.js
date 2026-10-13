// ===== Dữ liệu mẫu: tin thú cưng GIẢ để thử nghiệm =====
// Toàn bộ tên, số điện thoại (09000000xx), email (@example.com) và địa điểm trong file này là DỮ LIỆU GIẢ, không thuộc về người thật.
// Admin bấm nút "Nạp dữ liệu mẫu" ở Bảng điều khiển để đưa các tin này lên Firestore (chạy lại nhiều lần không bị trùng).
// SĐT/email được lưu ở bộ sưu tập riêng pet_contacts, không nằm trong tài liệu công khai của tin.
(function seedFakePets(){
  var records = [
    {
      pet: {
        id: 'pet_sample_seed_001',
        name: "Bé mèo Anh lông dài", type: "Mèo", breed: "Mèo Anh lông dài, màu xám trắng", gender: "",
        date: '15/09/2026', area: "Thủ Đức",
        location: "Khu vực phường Phú Hữu, TP. Thủ Đức",
        desc: "Mèo Anh lông dài màu xám trắng, nặng khoảng 5kg, lông đang mọc lại sau khi cạo. Đi lạc vào buổi tối. Ai thấy xin liên hệ giúp, có hậu tạ.",
        phone: '0900000001', zalo: 'https://zalo.me/0900000001',
        status: 'lost', icon: '🐱', imageData: [],
        ownerEmail: 'sample.user1@example.com', ownerName: "Nguyễn Văn A", createdAt: Date.now() - 1000*60*60*24*20
      }
    },
    {
      pet: {
        id: 'pet_sample_seed_002',
        name: "Mun", type: "Mèo", breed: "Mèo Anh lông ngắn màu xám", gender: "Đực",
        date: '15/09/2026', area: "TP.HCM",
        location: "Chưa rõ khu vực cụ thể",
        desc: "Mun đã đi lạc hơn một tháng. Gia đình vẫn đang tìm kiếm khắp nơi. Ai gặp bé xin liên hệ lại giúp, gia đình xin hậu tạ.",
        phone: '0900000002', zalo: 'https://zalo.me/0900000002',
        status: 'lost', icon: '🐱', imageData: [],
        ownerEmail: 'sample.user2@example.com', ownerName: "Trần Thị B", createdAt: Date.now() - 1000*60*60*24*0.1
      }
    },
    {
      pet: {
        id: 'pet_sample_seed_003',
        name: "Bé cún đi lạc", type: "Chó", breed: "Chó lông vàng, chưa rõ giống", gender: "",
        date: '15/09/2026', area: "Quận 12",
        location: "Khu vực phường Thới An, Quận 12, TP.HCM",
        desc: "Bé đi lạc từ chiều hôm qua, có người thấy gần khu vực chợ. Ai thấy xin giữ bé lại giúp, gia đình đội ơn.",
        phone: '0900000003', zalo: 'https://zalo.me/0900000003',
        status: 'lost', icon: '🐶', imageData: [],
        ownerEmail: 'sample.user3@example.com', ownerName: "Lê Văn C", createdAt: Date.now() - 1000*60*60*24*0.8
      }
    },
    {
      pet: {
        id: 'pet_sample_seed_004',
        name: "Mèo mướp vằn đen", type: "Mèo", breed: "Mèo mướp lông xù, đã thiến", gender: "Đực",
        date: '15/09/2026', area: "Hà Nội",
        location: "Khu vực xã Ngọc Hồi, Thanh Trì, Hà Nội",
        desc: "Mèo mướp vằn đen, lông xù, bốn chân và cổ màu đen, nặng khoảng 4kg. Mất tích từ đêm nay đến nay chưa về.",
        phone: '0900000004', zalo: 'https://zalo.me/0900000004',
        status: 'lost', icon: '🐱', imageData: [],
        ownerEmail: 'sample.user4@example.com', ownerName: "Phạm Thị D", createdAt: Date.now() - 1000*60*60*24*19
      }
    },
    {
      pet: {
        id: 'pet_sample_seed_005',
        name: "Bi", type: "Chó", breed: "Chó nhỏ, bị tật ở chân", gender: "",
        date: '15/09/2026', area: "TP. Thủ Đức",
        location: "Khu vực phường Bình Chiểu, TP. Thủ Đức",
        desc: "Bi bị lạc lúc khuya, bé đi hơi khập khiễng ở chân sau. Ai ở khu vực này thấy bé xin liên hệ giúp.",
        phone: '0900000005', zalo: 'https://zalo.me/0900000005',
        status: 'lost', icon: '🐶', imageData: [],
        ownerEmail: 'sample.user5@example.com', ownerName: "Hoàng Văn E", createdAt: Date.now() - 1000*60*60*24*0.9
      }
    },
    {
      pet: {
        id: 'pet_sample_seed_006',
        name: "Mèo cam đang tìm chủ", type: "Mèo", breed: "Mèo cam", gender: "",
        date: '15/09/2026', area: "Tân Bình",
        location: "Khu vực phường 4, Tân Bình, TP.HCM",
        desc: "Có bé mèo cam đi lạc xuất hiện ở khu vực này, đang được tạm giữ chăm sóc. Chủ nhân vui lòng mô tả đặc điểm để xác nhận.",
        phone: '0900000006', zalo: 'https://zalo.me/0900000006',
        status: 'found', icon: '🐱', imageData: [],
        ownerEmail: 'sample.user6@example.com', ownerName: "Võ Thị F", createdAt: Date.now() - 1000*60*60*24*0.7
      }
    },
    {
      pet: {
        id: 'pet_sample_seed_007',
        name: "Poodle đi lạc", type: "Chó", breed: "Chó Poodle", gender: "",
        date: '15/09/2026', area: "Quận 8",
        location: "Khu vực gần trường học, phường 5, Quận 8, TP.HCM",
        desc: "Poodle đi lạc vào buổi tối, chạy về hướng trường học. Ai thấy hoặc đang giữ bé xin liên hệ, gia đình xin cảm ơn.",
        phone: '0900000007', zalo: 'https://zalo.me/0900000007',
        status: 'lost', icon: '🐶', imageData: [],
        ownerEmail: 'sample.user7@example.com', ownerName: "Đặng Văn G", createdAt: Date.now() - 1000*60*60*24*6
      }
    },
    {
      pet: {
        id: 'pet_sample_seed_008',
        name: "Cún nhỏ đi lạc", type: "Chó", breed: "Chó nhỏ", gender: "",
        date: '15/09/2026', area: "Đà Nẵng",
        location: "Khu vực phường An Hải, Sơn Trà, Đà Nẵng",
        desc: "Bé cún nhỏ đi lạc gần khu vực khách sạn ven đường. Mọi người thấy bé xin liên hệ giúp.",
        phone: '0900000008', zalo: 'https://zalo.me/0900000008',
        status: 'lost', icon: '🐶', imageData: [],
        ownerEmail: 'sample.user8@example.com', ownerName: "Bùi Thị H", createdAt: Date.now() - 1000*60*60*24*2
      }
    }
  ];

  window.PFSeed = {
    count: records.length,
    run: function(){
      if (typeof requireAdmin === 'function' && !requireAdmin('nạp dữ liệu mẫu')) return 0;
      var pets = loadPets(), have = {}, added = 0;
      pets.forEach(function(p){ have[p.id] = true; });
      records.forEach(function(r){
        if (have[r.pet.id]) return;
        var clean = PFSec.sanitizePet(Object.assign({}, r.pet, { ownerUid: '' }));
        if (clean) { pets.push(clean); added++; }
      });
      if (added && !savePets(pets)) return 0;
      return added;
    }
  };
})();
