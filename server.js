const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- CƠ SỞ DỮ LIỆU CỨNG FILE JSON (CHỐNG MẤT DỮ LIỆU) ---
let db = {
    users: [
        { taiKhoan: "admin", matKhau: "123456", quyen: "admin" } // Tài khoản admin mặc định
    ],
    dsThanhVienBang: [],
    dsThamGiaBangChien: [],
    dsThamGiaScrim: [],
    doiHinhBangChien: { "Team Mid": [], "Team Trụ": [], "Team Def": [], "Team Vật tư": [] },
    doiHinhScrim: { "Team Mid": [], "Team Trụ": [], "Team Def": [], "Team Vật tư": [] },
    bxhBangChien: [],
    bxhScrim: []
};

// Hàm đọc dữ liệu từ file khi mở server
function loadDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            db = JSON.parse(data);
            console.log("[HỆ THỐNG] Đã tải dữ liệu thành công từ file database.json");
        } else {
            saveDatabase();
        }
    } catch (err) {
        console.error("Lỗi đọc file database:", err);
    }
}

// Hàm ghi dữ liệu xuống file cứng khi có thay đổi
function saveDatabase() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    } catch (err) {
        console.error("Lỗi ghi file database:", err);
    }
}

// --- API ĐĂNG KÝ / ĐĂNG NHẬP ---
app.post('/api/auth/register', (req, res) => {
    const { taiKhoan, matKhau } = req.body;
    if (!taiKhoan || !matKhau) return res.json({ success: false, error: "Vui lòng nhập đủ tài khoản và mật khẩu!" });
    
    const tk = taiKhoan.trim().toLowerCase();
    const check = db.users.find(u => u.taiKhoan === tk);
    if (check) return res.json({ success: false, error: "Tài khoản này đã tồn tại rồi!" });

    // Tài khoản đăng ký mặc định là quyền "user" (Chỉ xem). Muốn làm admin thì sửa trực tiếp trong file database.json thành "admin"
    db.users.push({ taiKhoan: tk, matKhau: matKhau.trim(), quyen: "user" });
    saveDatabase();
    res.json({ success: true });
});

app.post('/api/auth/login', (req, res) => {
    const { taiKhoan, matKhau } = req.body;
    const tk = taiKhoan.trim().toLowerCase();
    const user = db.users.find(u => u.taiKhoan === tk && u.matKhau === matKhau.trim());
    
    if (user) {
        res.json({ success: true, quyen: user.quyen, taiKhoan: user.taiKhoan });
    } else {
        res.json({ success: false, error: "Sai tài khoản hoặc mật khẩu rồi em ơi!" });
    }
});

// --- API TRUY XUẤT DỮ LIỆU (AI CŨNG XEM ĐƯỢC) ---
app.get('/api/all-data', (req, res) => {
    res.json({ 
        dsThanhVienBang: db.dsThanhVienBang, 
        dsThamGiaBangChien: db.dsThamGiaBangChien, 
        dsThamGiaScrim: db.dsThamGiaScrim, 
        doiHinhBangChien: db.doiHinhBangChien, 
        doiHinhScrim: db.doiHinhScrim, 
        bxhBangChien: db.bxhBangChien, 
        bxhScrim: db.bxhScrim 
    });
});

// --- MIDDLEWARE CHẶN CÁC THAO TÁC SỬA ĐỔI NẾU KHÔNG PHẢI ADMIN ---
function checkAdmin(req, res, next) {
    const userRole = req.headers['user-role'];
    if (userRole === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, error: "Quyền lực từ chối! Chỉ Admin mới được thực hiện thao tác này." });
    }
}

// --- CÁC API THAO TÁC (YÊU CẦU QUYỀN ADMIN QUA ĐƯỜNG TRUYỀN CHECKADMIN) ---
app.post('/api/register-member', checkAdmin, (req, res) => {
    const { ten, idGame, monPhai, chucVu, ghiChu } = req.body;
    if (!ten) return res.status(400).json({ success: false });
    const idx = db.dsThanhVienBang.findIndex(p => p.ten.toLowerCase() === ten.toLowerCase());
    if (idx !== -1) db.dsThanhVienBang[idx] = { ten, idGame, monPhai, chucVu, ghiChu };
    else db.dsThanhVienBang.push({ ten, idGame, monPhai, chucVu, ghiChu });
    saveDatabase();
    res.json({ success: true });
});

app.post('/api/delete-member', checkAdmin, (req, res) => {
    const { ten } = req.body;
    db.dsThanhVienBang = db.dsThanhVienBang.filter(p => p.ten !== ten);
    saveDatabase();
    res.json({ success: true });
});

app.post('/api/register', checkAdmin, (req, res) => {
    const { loai, ten, idGame, monPhai, khuVuc, ghiChu } = req.body;
    if (!ten) return res.status(400).json({ success: false });
    const targetList = loai === 'bangchien' ? db.dsThamGiaBangChien : db.dsThamGiaScrim;
    const idx = targetList.findIndex(p => p.ten.toLowerCase() === ten.toLowerCase());
    if (idx !== -1) targetList[idx] = { ten, idGame, monPhai, khuVuc, ghiChu };
    else targetList.push({ ten, idGame, monPhai, khuVuc, ghiChu });
    saveDatabase();
    res.json({ success: true });
});

app.post('/api/delete-player', checkAdmin, (req, res) => {
    const { loai, ten } = req.body;
    if (loai === 'bangchien') db.dsThamGiaBangChien = db.dsThamGiaBangChien.filter(p => p.ten !== ten);
    else db.dsThamGiaScrim = db.dsThamGiaScrim.filter(p => p.ten !== ten);
    saveDatabase();
    res.json({ success: true });
});

app.post('/api/save-team-excel', checkAdmin, (req, res) => {
    const { loai, doiHinh } = req.body;
    if (loai === 'bangchien') db.doiHinhBangChien = doiHinh;
    else db.doiHinhScrim = doiHinh;
    saveDatabase();
    res.json({ success: true });
});

app.post('/api/save-bxh', checkAdmin, (req, res) => {
    const { loai, record } = req.body;
    if (!record || !record.matchName || !record.ten) return res.status(400).json({ success: false });
    const targetBXH = loai === 'bangchien' ? db.bxhBangChien : db.bxhScrim;
    const formattedRecord = {
        matchName: record.matchName.trim(), ten: record.ten.trim(), idGame: record.idGame || "0000",
        monPhai: record.monPhai || "Cửu Linh", doan: record.doan || "Đoàn 1",
        dameNguoi: parseInt(record.dameNguoi) || 0, dameTru: parseInt(record.dameTru) || 0,
        mang: parseInt(record.mang) || 0, createdAt: new Date().toLocaleDateString('vi-VN')
    };
    const idx = targetBXH.findIndex(p => p.matchName.toLowerCase() === formattedRecord.matchName.toLowerCase() && p.ten.toLowerCase() === formattedRecord.ten.toLowerCase());
    if (idx !== -1) targetBXH[idx] = formattedRecord;
    else targetBXH.push(formattedRecord);
    saveDatabase();
    res.json({ success: true });
});

app.post('/api/delete-bxh', checkAdmin, (req, res) => {
    const { loai, ten } = req.body;
    if (loai === 'bangchien') db.bxhBangChien = db.bxhBangChien.filter(p => p.ten.toLowerCase() !== ten.toLowerCase());
    else db.bxhScrim = db.bxhScrim.filter(p => p.ten.toLowerCase() !== ten.toLowerCase());
    saveDatabase();
    res.json({ success: true });
});

app.post('/api/delete-entire-match', checkAdmin, (req, res) => {
    const { loai, matchName } = req.body;
    if (loai === 'bangchien') db.bxhBangChien = db.bxhBangChien.filter(item => item.matchName.toLowerCase() !== matchName.toLowerCase());
    else db.bxhScrim = db.bxhScrim.filter(item => item.matchName.toLowerCase() !== matchName.toLowerCase());
    saveDatabase();
    res.json({ success: true });
});

// Chạy khởi động hệ thống
loadDatabase();
app.listen(PORT, () => {
    console.log(`[HỆ THỐNG] Máy chủ chạy mượt mà tại: http://localhost:${PORT}`);
});