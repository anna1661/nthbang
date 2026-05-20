const express = require('express');
const path = require('path');
const app = express();

// --- CẤU HÌNH CỔNG LINH HOẠT CHO RENDER ---
const PORT = process.env.PORT || 3000;

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
    try {
        const { loai, ten, idGame, monPhai, khuVuc } = req.body;
        if (!ten) return res.status(400).json({ success: false, error: "Tên không được trống" });

        const targetList = loai === 'bangchien' ? dsThamGiaBangChien : dsThamGiaScrim;
        
        const idx = targetList.findIndex(p => p.ten && p.ten.toLowerCase() === ten.toLowerCase());
        if (idx !== -1) {
            targetList[idx] = { ten, idGame, monPhai, khuVuc };
        } else {
            targetList.push({ ten, idGame, monPhai, khuVuc });
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

// Lưu hoặc cập nhật thành tích điểm số vào Bảng Vàng (BXH)
app.post('/api/save-bxh', (req, res) => {
    try {
        const { loai, record } = req.body; 
        
        if (!record || !record.ten) {
            return res.status(400).json({ success: false, error: "Thiếu thông tin tên người chơi!" });
        }

        const targetBXH = loai === 'bangchien' ? bxhBangChien : bxhScrim;
        
        const formattedRecord = {
            ten: record.ten.trim(),
            idGame: record.idGame || "0000",
            monPhai: record.monPhai || "Cửu Linh",
            doan: record.doan || "Đoàn 1",
            dameNguoi: parseInt(record.dameNguoi) || 0,
            dameTru: parseInt(record.dameTru) || 0,
            mang: parseInt(record.mang) || 0
        };
        
        const idx = targetBXH.findIndex(p => p.ten && p.ten.trim().toLowerCase() === formattedRecord.ten.toLowerCase());
        
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

// === THÊM MỚI: API XÓA NHÂN VẬT KHỎI BẢNG VÀNG (BXH) ===
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

// --- KHỞI CHẠY MÁY CHỦ ---
app.listen(PORT, () => {
    console.log(`[HỆ THỐNG] Máy chủ đang chạy tại cổng: ${PORT}`);
});