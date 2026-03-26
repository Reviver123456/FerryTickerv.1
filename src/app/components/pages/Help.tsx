"use client";

import { useState } from "react";
import { Mail, Phone, MessageCircle, ChevronRight, HelpCircle } from "lucide-react";

export function Help() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "จองตั๋วล่วงหน้าได้กี่วัน?",
      answer:
        "คุณสามารถจองตั๋วล่วงหน้าได้สูงสุด 30 วัน และจองขั้นต่ำ 2 ชั่วโมงก่อนเวลาเดินทาง",
    },
    {
      question: "สามารถยกเลิกตั๋วได้หรือไม่?",
      answer:
        "สามารถยกเลิกได้ก่อนเวลาเดินทาง 24 ชั่วโมง โดยจะคืนเงิน 80% ของมูลค่าตั๋ว หากยกเลิกภายใน 24 ชั่วโมง จะไม่มีการคืนเงิน",
    },
    {
      question: "เด็กต้องซื้อตั๋วไหม?",
      answer:
        "เด็กที่มีส่วนสูงต่ำกว่า 90 เซนติเมตร ไม่เสียค่าโดยสาร เด็กอายุ 3-12 ปี ซื้อตั๋วราคา 100 บาท",
    },
    {
      question: "มีที่จอดรถที่ท่าเรือไหม?",
      answer:
        "มีที่จอดรถฟรีที่ท่าเรือทั้งหมด จำนวนจำกัดประมาณ 50 คัน ให้บริการแบบเข้าก่อน-จอดก่อน",
    },
    {
      question: "ต้องถึงท่าเรือก่อนเวลาเท่าไหร่?",
      answer:
        "แนะนำให้มาถึงท่าเรือก่อนเวลาออกเดินทางอย่างน้อย 15 นาที เพื่อเช็คอินและขึ้นเรืออย่างสะดวก",
    },
    {
      question: "สามารถนำสัตว์เลี้ยงขึ้นเรือได้ไหม?",
      answer:
        "ไม่อนุญาตให้นำสัตว์เลี้ยงขึ้นเรือ ยกเว้นสัตว์ช่วยเหลือผู้พิการที่มีเอกสารรับรองจากทางการ",
    },
    {
      question: "มีบริการอาหารบนเรือไหม?",
      answer:
        "สำหรับตั๋วธรรมดาไม่มีบริการอาหาร แต่ตั๋ว VIP จะมีเครื่องดื่มและขนมฟรี สามารถนำอาหารขึ้นเรือได้",
    },
    {
      question: "ถ้าพลาดเรือต้องทำอย่างไร?",
      answer:
        "หากพลาดเรือ สามารถติดต่อเจ้าหน้าที่ที่ท่าเรือเพื่อเปลี่ยนรอบได้ โดยอาจมีค่าธรรมเนียมเพิ่มเติม 50 บาท",
    },
  ];

  const contactMethods = [
    {
      icon: Phone,
      title: "โทรศัพท์",
      detail: "02-123-4567",
      description: "จันทร์-ศุกร์ 08:00-18:00",
      action: "โทรเลย",
    },
    {
      icon: Mail,
      title: "อีเมล",
      detail: "support@ferryticket.com",
      description: "ตอบภายใน 24 ชั่วโมง",
      action: "ส่งอีเมล",
    },
    {
      icon: MessageCircle,
      title: "แชทสด",
      detail: "พูดคุยกับเจ้าหน้าที่",
      description: "ให้บริการ 24/7",
      action: "เริ่มแชท",
    },
  ];

  return (
    <div className="booking-page">
      <div className="booking-page__container booking-page__container--md">
        <div className="mb-8">
          <h1 className="text-2xl mb-2">ศูนย์ช่วยเหลือ</h1>
          <p className="text-gray-600 text-sm">คำถามที่พบบ่อยและช่องทางติดต่อ</p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {contactMethods.map((method, idx) => {
            const Icon = method.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] flex items-center justify-center">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="mb-2">{method.title}</h3>
                <div className="text-sm text-[#0EA5E9] mb-2">{method.detail}</div>
                <p className="text-xs text-gray-600 mb-4">{method.description}</p>
                <button className="text-sm text-[#0EA5E9] hover:text-[#2563EB] transition-colors">
                  {method.action}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-24">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-6 h-6 text-[#0EA5E9]" />
            <h2 className="text-xl">คำถามที่พบบ่อย</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-gray-100 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <span className="pr-4">{faq.question}</span>
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      openFaq === idx ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-gray-600 border-t border-gray-100 pt-4 bg-gray-50">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
