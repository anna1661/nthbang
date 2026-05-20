const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- CƠ SỞ DỮ LIỆU ĐỘNG (LƯU TRONG BỘ NHỚ RAM) ---

// 1. Dữ liệu thành viên đăng ký tham gia (Danh sách tổng)
let dsThamGiaBangChien = [
    { ten: "SUPREME_GM", idGame: "0001", monPhai: "Cửu Linh", khuVuc: "Team Mid" },
    { ten: "Hắc_Công_Tử", idGame: "0024", monPhai: "Thiết Y", khuVuc: "Team Def" },
    { ten: "Mộng_Vân", idGame: "0102", monPhai: "Toái Mộng", khuVuc: "Team Trụ" }
];

let dsThamGiaScrim = [
    { ten: "SUPREME_GM", idGame: "0001", monPhai: "Cửu Linh", khuVuc: "Team Mid" },
    { ten: "Bạch_Liên", idGame: "0055", monPhai: "Tố Vấn", khuVuc: "Team Mid" }
];

// 2. Dữ liệu xếp Đội hình chiến thuật (Chia nhóm dạng Excel)
let doiHinhBangChien = {
    "Team Mid": [], "Team Trụ": [], "Team Def": [], "Team Vật tư": []
};
let doiHinhScrim = {
    "Team Mid": [], "Team Trụ": [], "Team Def": [], "Team Vật tư": []
};

// 3. Dữ liệu điểm số Bảng Xếp Hạng (Chia làm 3 Đoàn)
let bxhBangChien = [
    { ten: "SUPREME_GM", idGame: "0001", monPhai: "Cửu Linh", doan: "Đoàn 1", dameNguoi: 1500000, dameTru: 450000, mang: 18 },
    { ten: "Hắc_Công_Tử", idGame: "0024", monPhai: "Thiết Y", doan: "Đoàn 2", dameNguoi: 400000, dameTru: 900000, mang: 5 }
];

let bxhScrim = [
    { ten: "SUPREME_GM", idGame: "0001", monPhai: "Cửu Linh", doan: "Đoàn 1", dameNguoi: 1200000, dameTru: 300000, mang: 12 }
];

// --- CÁC ĐƯỜNG DẪN API TRUY XUẤT DỮ LIỆU ---

// Lấy toàn bộ dữ liệu hệ thống đổ ra giao diện
app.get('/api/all-data', (req, res) => {
    res.json({ dsThamGiaBangChien, dsThamGiaScrim, doiHinhBangChien, doiHinhScrim, bxhBangChien, bxhScrim });
});

// Xử lý đăng ký danh sách tham gia
app.post('/api/register', (req, res) => {
    const { loai, ten, idGame, monPhai, khuVuc } = req.body;
    const targetList = loai === 'bangchien' ? dsThamGiaBangChien : dsThamGiaScrim;
    
    // Nếu trùng tên thì cập nhật thông tin, chưa trùng thì push mới
    const idx = targetList.findIndex(p => p.ten.toLowerCase() === ten.toLowerCase());
    if (idx !== -1) {
        targetList[idx] = { ten, idGame, monPhai, khuVuc };
    } else {
        targetList.push({ ten, idGame, monPhai, khuVuc });
    }
    res.json({ success: true });
});

// Xóa khỏi danh sách tham gia
app.post('/api/delete-player', (req, res) => {
    const { loai, ten } = req.body;
    if (loai === 'bangchien') {
        dsThamGiaBangChien = dsThamGiaBangChien.filter(p => p.ten !== ten);
    } else {
        dsThamGiaScrim = dsThamGiaScrim.filter(p => p.ten !== ten);
    }
    res.json({ success: true });
});

// Cập nhật sơ đồ đội hình Excel chiến thuật
app.post('/api/save-team-excel', (req, res) => {
    const { loai, doiHinh } = req.body;
    if (loai === 'bangchien') doiHinhBangChien = doiHinh;
    else doiHinhScrim = doiHinh;
    res.json({ success: true });
});

// Lưu hoặc cập nhật thành tích điểm số vào BXH
app.post('/api/save-bxh', (req, res) => {
    const { loai, record } = req.body; // record: {ten, idGame, monPhai, doan, dameNguoi, dameTru, mang}
    const targetBXH = loai === 'bangchien' ? bxhBangChien : bxhScrim;
    
    const idx = targetBXH.findIndex(p => p.ten.toLowerCase() === record.ten.toLowerCase());
    if (idx !== -1) targetBXH[idx] = record;
    else targetBXH.push(record);
    
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`[HỆ THỐNG] Máy chủ chạy mượt mà tại: http://localhost:${PORT}`);
});