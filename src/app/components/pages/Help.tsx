"use client";

import clsx from "clsx";
import { useState } from "react";
import { Mail, Phone, MessageCircle, ChevronRight, HelpCircle } from "lucide-react";
import styles from "@/styles/pages/Help.module.css";

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
    <div className={styles.page}>
      <div className={styles.containerMd}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>ศูนย์ช่วยเหลือ</h1>
          <p className={styles.headerText}>คำถามที่พบบ่อยและช่องทางติดต่อ</p>
        </div>

        <div className={styles.contactGrid}>
          {contactMethods.map((method, idx) => {
            const Icon = method.icon;
            return (
              <div
                key={idx}
                className={styles.contactCard}
              >
                <div className={styles.contactIconWrap}>
                  <Icon className={styles.contactIcon} />
                </div>
                <h3 className={styles.contactTitle}>{method.title}</h3>
                <div className={styles.contactDetail}>{method.detail}</div>
                <p className={styles.contactDescription}>{method.description}</p>
                <button className={styles.contactButton}>
                  {method.action}
                </button>
              </div>
            );
          })}
        </div>

        <div className={styles.faqCard}>
          <div className={styles.faqHeader}>
            <HelpCircle className={styles.faqHeaderIcon} />
            <h2 className={styles.faqTitle}>คำถามที่พบบ่อย</h2>
          </div>

          <div className={styles.faqList}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={styles.faqItem}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className={styles.faqQuestion}
                >
                  <span className={styles.faqQuestionText}>{faq.question}</span>
                  <ChevronRight
                    className={clsx(styles.faqChevron, openFaq === idx && styles.faqChevronOpen)}
                  />
                </button>
                {openFaq === idx && (
                  <div className={styles.faqAnswer}>
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
