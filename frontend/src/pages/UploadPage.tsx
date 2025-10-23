import React, { useRef, useState } from "react";
import { uploadCsv } from "../api/metricsApi";


export default function UploadPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [msg, setMsg] = useState<string>("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setMsg("กรุณาเลือกไฟล์ก่อนค่ะ");
    try {
      const res = await uploadCsv(file);
      setMsg(`✅ อัปโหลดสำเร็จ ${res.rows_inserted} แถว`);
    } catch (err) {
      setMsg(`❌ อัปโหลดล้มเหลว`);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow p-4 rounded-xl">
      <h2 className="text-lg font-medium mb-2">อัปโหลดข้อมูล CSV</h2>
      <form onSubmit={handleUpload} className="flex flex-col gap-2">
        <input ref={fileRef} type="file" accept=".csv" />
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">อัปโหลด</button>
      </form>
      <p className="text-sm mt-2 text-gray-600">{msg}</p>
    </div>
  );
};
