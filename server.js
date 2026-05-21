const express = require('express');
const path = require('path');
const app = express();

// --- CẤU HÌNH CỔNG LINH HOẠT CHO RENDER ---
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- CƠ SỞ DỮ LIỆU ĐỘNG (LƯU TRONG BỘ NHỚ RAM) ---

// [BỔ SUNG]: Dữ liệu quản lý Thành Viên Toàn Bang
let dsThanhVienBang = [
    { ten: "SUPREME_GM", idGame: "0001", monPhai: "Cửu Linh", chucVu: "Đại Đương Gia", ghiChu: "Chủ bang" },
    { ten: "Hắc_Công_Tử", idGame: "0024", monPhai: "Thiết Y", chucVu: "Sát Đường Chủ", ghiChu: "Main tank" }
];

// 1. Dữ liệu thành viên đăng ký tham gia (Danh sách tổng)
let dsThamGiaBangChien = [
    { ten: "SUPREME_GM", idGame: "0001", monPhai: "Cửu Linh", khuVuc: "Team Mid", ghiChu: "" },
    { ten: "Hắc_Công_Tử", idGame: "0024", monPhai: "Thiết Y", khuVuc: "Team Def", ghiChu: "" }
];

let dsThamGiaScrim = [
    { ten: "SUPREME_GM", idGame: "0001", monPhai: "Cửu Linh", khuVuc: "Team Mid", ghiChu: "" }
];

// 2. Dữ liệu xếp Đội hình chiến thuật (Chia nhóm dạng Excel)
let doiHinhBangChien = {
    "Team Mid": [], "Team Trụ": [], "Team Def": [], "Team Vật tư": []
};
let doiHinhScrim = {
    "Team Mid": [], "Team Trụ": [], "Team Def": [], "Team Vật tư": []
};

// 3. Dữ liệu điểm số Bảng Xếp Hạng (Đã tích hợp matchName để lưu trữ thành các trận riêng biệt)
let bxhBangChien = [
    { matchName: "BC Kim Phong Trận 1", ten: "SUPREME_GM", idGame: "0001", monPhai: "Cửu Linh", doan: "Đoàn 1", dameNguoi: 1500000, dameTru: 450000, mang: 18, createdAt: "21/05/2026" },
    { matchName: "BC Kim Phong Trận 1", ten: "Hắc_Công_Tử", idGame: "0024", monPhai: "Thiết Y", doan: "Đoàn 2", dameNguoi: 400000, dameTru: 900000, mang: 5, createdAt: "21/05/2026" }
];

let bxhScrim = [
    { matchName: "Scrim Ngạo Thế T1", ten: "SUPREME_GM", idGame: "0001", monPhai: "Cửu Linh", doan: "Đoàn 1", dameNguoi: 1200000, dameTru: 300000, mang: 12, createdAt: "21/05/2026" }
];

// --- CÁC ĐƯỜNG DẪN API TRUY XUẤT DỮ LIỆU ---

// Lấy toàn bộ dữ liệu hệ thống đổ ra giao diện (Đã thêm mục dsThanhVienBang)
app.get('/api/all-data', (req, res) => {
    res.json({ dsThanhVienBang, dsThamGiaBangChien, dsThamGiaScrim, doiHinhBangChien, doiHinhScrim, bxhBangChien, bxhScrim });
});

// [THÊM MỚI]: Thêm thành viên vào sổ bang
app.post('/api/register-member', (req, res) => {
    try {
        const { ten, idGame, monPhai, chucVu, ghiChu } = req.body;
        if (!ten) return res.status(400).json({ success: false, error: "Tên thành viên không được trống" });

        const idx = dsThanhVienBang.findIndex(p => p.ten && p.ten.toLowerCase() === ten.toLowerCase());
        if (idx !== -1) {
            dsThanhVienBang[idx] = { ten, idGame, monPhai, chucVu, ghiChu };
        } else {
            dsThanhVienBang.push({ ten, idGame, monPhai, chucVu, ghiChu });
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Lỗi thêm thành viên bang:", err);
        res.status(500).json({ success: false });
    }
});

// [THÊM MỚI]: Xóa thành viên khỏi sổ bang
app.post('/api/delete-member', (req, res) => {
    try {
        const { ten } = req.body;
        dsThanhVienBang = dsThanhVienBang.filter(p => p.ten !== ten);
        res.json({ success: true });
    } catch (err) {
        console.error("Lỗi xóa thành viên bang:", err);
        res.status(500).json({ success: false });
    }
});

// Xử lý đăng ký danh sách tham gia chiến trường
app.post('/api/register', (req, res) => {
    try {
        const { loai, ten, idGame, monPhai, khuVuc, ghiChu } = req.body;
        if (!ten) return res.status(400).json({ success: false, error: "Tên không được trống" });

        const targetList = loai === 'bangchien' ? dsThamGiaBangChien : dsThamGiaScrim;
        
        const idx = targetList.findIndex(p => p.ten && p.ten.toLowerCase() === ten.toLowerCase());
        if (idx !== -1) {
            targetList[idx] = { ten, idGame, monPhai, khuVuc, ghiChu };
        } else {
            targetList.push({ ten, idGame, monPhai, khuVuc, ghiChu });
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Lỗi Đăng ký quân số:", err);
        res.status(500).json({ success: false });
    }
});

// Xóa khỏi danh sách tham gia
app.post('/api/delete-player', (req, res) => {
    try {
        const { loai, ten } = req.body;
        if (loai === 'bangchien') {
            dsThamGiaBangChien = dsThamGiaBangChien.filter(p => p.ten !== ten);
        } else {
            dsThamGiaScrim = dsThamGiaScrim.filter(p => p.ten !== ten);
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Lỗi Xóa thành viên:", err);
        res.status(500).json({ success: false });
    }
});

// Cập nhật sơ đồ đội hình Excel chiến thuật
app.post('/api/save-team-excel', (req, res) => {
    try {
        const { loai, doiHinh } = req.body;
        if (loai === 'bangchien') doiHinhBangChien = doiHinh;
        else doiHinhScrim = doiHinh;
        res.json({ success: true });
    } catch (err) {
        console.error("Lỗi Lưu đội hình Excel:", err);
        res.status(500).json({ success: false });
    }
});

// [SỬA ĐỔI]: Lưu hoặc cập nhật thành tích điểm số dựa vào matchName và tên người chơi
app.post('/api/save-bxh', (req, res) => {
    try {
        const { loai, record } = req.body; 
        
        if (!record || !record.matchName || !record.ten) {
            return res.status(400).json({ success: false, error: "Thiếu thông tin tên trận hoặc tên người chơi!" });
        }

        const targetBXH = loai === 'bangchien' ? bxhBangChien : bxhScrim;
        const todayStr = new Date().toLocaleDateString('vi-VN');
        
        const formattedRecord = {
            matchName: record.matchName.trim(),
            ten: record.ten.trim(),
            idGame: record.idGame || "0000",
            monPhai: record.monPhai || "Cửu Linh",
            doan: record.doan || "Đoàn 1",
            dameNguoi: parseInt(record.dameNguoi) || 0,
            dameTru: parseInt(record.dameTru) || 0,
            mang: parseInt(record.mang) || 0,
            createdAt: todayStr
        };
        
        // Điều kiện check trùng: Phải trùng CẢ tên trận đấu VÀ tên nhân vật
        const idx = targetBXH.findIndex(p => 
            p.matchName && p.matchName.toLowerCase() === formattedRecord.matchName.toLowerCase() &&
            p.ten && p.ten.trim().toLowerCase() === formattedRecord.ten.toLowerCase()
        );
        
        if (idx !== -1) {
            targetBXH[idx] = formattedRecord; 
        } else {
            targetBXH.push(formattedRecord);  
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error("Lỗi Xử lý lưu Bảng Vàng Backend:", err);
        res.status(500).json({ success: false });
    }
});

// Xóa 1 dòng nhân vật đơn lẻ trong bảng vàng
app.post('/api/delete-bxh', (req, res) => {
    try {
        const { loai, ten } = req.body;
        if (!ten) return res.status(400).json({ success: false, error: "Thiếu tên để xóa" });

        if (loai === 'bangchien') {
            bxhBangChien = bxhBangChien.filter(p => p.ten && p.ten.trim().toLowerCase() !== ten.trim().toLowerCase());
        } else {
            bxhScrim = bxhScrim.filter(p => p.ten && p.ten.trim().toLowerCase() !== ten.trim().toLowerCase());
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Lỗi xóa dòng Bảng Vàng:", err);
        res.status(500).json({ success: false });
    }
});

// [THÊM MỚI CẤP THIẾT]: API Xóa sạch toàn bộ dữ liệu của một Trận Đấu khi điền nhầm
app.post('/api/delete-entire-match', (req, res) => {
    try {
        const { loai, matchName } = req.body;
        if (!matchName) return res.status(400).json({ success: false, error: "Thiếu tên trận đấu để xóa" });

        if (loai === 'bangchien') {
            bxhBangChien = bxhBangChien.filter(item => item.matchName && item.matchName.toLowerCase() !== matchName.toLowerCase());
        } else {
            bxhScrim = bxhScrim.filter(item => item.matchName && item.matchName.toLowerCase() !== matchName.toLowerCase());
        }

        res.json({ success: true, message: "Đã xóa toàn bộ trận đấu thành công!" });
    } catch (err) {
        console.error("Lỗi xóa toàn bộ trận đấu ở Backend:", err);
        res.status(500).json({ success: false });
    }
});

// --- KHỞI CHẠY MÁY CHỦ ---
app.listen(PORT, () => {
    console.log(`[HỆ THỐNG] Máy chủ đang chạy tại cổng: ${PORT}`);
});