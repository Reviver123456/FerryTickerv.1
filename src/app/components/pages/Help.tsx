"use client";

import clsx from "clsx";
import { useState } from "react";
import { Mail, Phone, MessageCircle, ChevronRight, HelpCircle } from "lucide-react";
import { useAppContext } from "@/app/providers/AppProvider";
import type { AppLanguage } from "@/lib/i18n";
import styles from "@/styles/pages/Help.module.css";

const HELP_COPY: Record<
  AppLanguage,
  {
    headerTitle: string;
    headerText: string;
    faqTitle: string;
    faqs: Array<{ question: string; answer: string }>;
    contactMethods: Array<{ title: string; detail: string; description: string; action: string }>;
  }
> = {
  th: {
    headerTitle: "ศูนย์ช่วยเหลือ",
    headerText: "คำถามที่พบบ่อยและช่องทางติดต่อ",
    faqTitle: "คำถามที่พบบ่อย",
    faqs: [
      {
        question: "จองตั๋วล่วงหน้าได้กี่วัน?",
        answer: "คุณสามารถจองตั๋วล่วงหน้าได้สูงสุด 30 วัน และจองขั้นต่ำ 2 ชั่วโมงก่อนเวลาเดินทาง",
      },
      {
        question: "สามารถยกเลิกตั๋วได้หรือไม่?",
        answer: "สามารถยกเลิกได้ก่อนเวลาเดินทาง 24 ชั่วโมง โดยจะคืนเงิน 80% ของมูลค่าตั๋ว หากยกเลิกภายใน 24 ชั่วโมง จะไม่มีการคืนเงิน",
      },
      {
        question: "เด็กต้องซื้อตั๋วไหม?",
        answer: "เด็กที่มีส่วนสูงต่ำกว่า 90 เซนติเมตร ไม่เสียค่าโดยสาร เด็กอายุ 3-12 ปี ซื้อตั๋วราคา 100 บาท",
      },
      {
        question: "มีที่จอดรถที่ท่าเรือไหม?",
        answer: "มีที่จอดรถฟรีที่ท่าเรือทั้งหมด จำนวนจำกัดประมาณ 50 คัน ให้บริการแบบเข้าก่อน-จอดก่อน",
      },
      {
        question: "ต้องถึงท่าเรือก่อนเวลาเท่าไหร่?",
        answer: "แนะนำให้มาถึงท่าเรือก่อนเวลาออกเดินทางอย่างน้อย 15 นาที เพื่อเช็คอินและขึ้นเรืออย่างสะดวก",
      },
      {
        question: "สามารถนำสัตว์เลี้ยงขึ้นเรือได้ไหม?",
        answer: "ไม่อนุญาตให้นำสัตว์เลี้ยงขึ้นเรือ ยกเว้นสัตว์ช่วยเหลือผู้พิการที่มีเอกสารรับรองจากทางการ",
      },
      {
        question: "มีบริการอาหารบนเรือไหม?",
        answer: "สำหรับตั๋วธรรมดาไม่มีบริการอาหาร แต่ตั๋ว VIP จะมีเครื่องดื่มและขนมฟรี สามารถนำอาหารขึ้นเรือได้",
      },
      {
        question: "ถ้าพลาดเรือต้องทำอย่างไร?",
        answer: "หากพลาดเรือ สามารถติดต่อเจ้าหน้าที่ที่ท่าเรือเพื่อเปลี่ยนรอบได้ โดยอาจมีค่าธรรมเนียมเพิ่มเติม 50 บาท",
      },
    ],
    contactMethods: [
      { title: "โทรศัพท์", detail: "02-123-4567", description: "จันทร์-ศุกร์ 08:00-18:00", action: "โทรเลย" },
      { title: "อีเมล", detail: "support@ferryticket.com", description: "ตอบภายใน 24 ชั่วโมง", action: "ส่งอีเมล" },
      { title: "แชทสด", detail: "พูดคุยกับเจ้าหน้าที่", description: "ให้บริการ 24/7", action: "เริ่มแชท" },
    ],
  },
  zh: {
    headerTitle: "帮助中心",
    headerText: "常见问题与联系方式",
    faqTitle: "常见问题",
    faqs: [
      { question: "最多可以提前多久订票？", answer: "最多可提前 30 天订票，且最晚需在出发前至少 2 小时完成预订。" },
      { question: "可以取消票券吗？", answer: "出发前 24 小时以上可取消并退回 80% 票款；24 小时内取消则不退款。" },
      { question: "儿童需要买票吗？", answer: "身高低于 90 厘米的儿童免费；3-12 岁儿童票价为 100 泰铢。" },
      { question: "码头有停车位吗？", answer: "所有码头都提供免费停车位，约 50 个，先到先停。" },
      { question: "需要提前多久到达码头？", answer: "建议至少在开船前 15 分钟到达，以便顺利办理登船。" },
      { question: "可以携带宠物上船吗？", answer: "除持有合法证明的辅助动物外，其他宠物不允许上船。" },
      { question: "船上有餐饮服务吗？", answer: "普通票不含餐饮；VIP 票提供免费饮料和小食，也可自行携带食物上船。" },
      { question: "如果错过船班怎么办？", answer: "如错过船班，可联系码头工作人员改签，可能需另付 50 泰铢手续费。" },
    ],
    contactMethods: [
      { title: "电话", detail: "02-123-4567", description: "周一至周五 08:00-18:00", action: "立即拨打" },
      { title: "邮箱", detail: "support@ferryticket.com", description: "24 小时内回复", action: "发送邮件" },
      { title: "在线聊天", detail: "与客服沟通", description: "24/7 提供服务", action: "开始聊天" },
    ],
  },
  en: {
    headerTitle: "Help Center",
    headerText: "Frequently asked questions and contact options",
    faqTitle: "Frequently Asked Questions",
    faqs: [
      { question: "How far in advance can I book?", answer: "You can book up to 30 days in advance, and at least 2 hours before departure." },
      { question: "Can I cancel my ticket?", answer: "You can cancel more than 24 hours before departure for an 80% refund. Cancellations within 24 hours are non-refundable." },
      { question: "Do children need a ticket?", answer: "Children under 90 cm travel free. Children aged 3-12 pay 100 THB." },
      { question: "Is parking available at the pier?", answer: "Free parking is available at every pier, with around 50 spaces on a first-come, first-served basis." },
      { question: "How early should I arrive at the pier?", answer: "We recommend arriving at least 15 minutes before departure for smooth check-in and boarding." },
      { question: "Can I bring pets on board?", answer: "Pets are not allowed on board, except certified assistance animals." },
      { question: "Is food available on board?", answer: "Standard tickets do not include food service. VIP tickets include complimentary drinks and snacks, and you may bring your own food." },
      { question: "What if I miss the ferry?", answer: "If you miss the ferry, contact the pier staff to change your sailing. An additional 50 THB fee may apply." },
    ],
    contactMethods: [
      { title: "Phone", detail: "02-123-4567", description: "Mon-Fri 08:00-18:00", action: "Call Now" },
      { title: "Email", detail: "support@ferryticket.com", description: "Replies within 24 hours", action: "Send Email" },
      { title: "Live Chat", detail: "Talk to support", description: "Available 24/7", action: "Start Chat" },
    ],
  },
};

export function Help() {
  const { language } = useAppContext();
  const text = HELP_COPY[language];
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const contactIcons = [Phone, Mail, MessageCircle];

  return (
    <div className={styles.page}>
      <div className={styles.containerMd}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>{text.headerTitle}</h1>
          <p className={styles.headerText}>{text.headerText}</p>
        </div>

        <div className={styles.contactGrid}>
          {text.contactMethods.map((method, idx) => {
            const Icon = contactIcons[idx] ?? MessageCircle;

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
                <button type="button" className={styles.contactButton}>
                  {method.action}
                </button>
              </div>
            );
          })}
        </div>

        <div className={styles.faqCard}>
          <div className={styles.faqHeader}>
            <HelpCircle className={styles.faqHeaderIcon} />
            <h2 className={styles.faqTitle}>{text.faqTitle}</h2>
          </div>

          <div className={styles.faqList}>
            {text.faqs.map((faq, idx) => (
              <div
                key={idx}
                className={styles.faqItem}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className={styles.faqQuestion}
                >
                  <span className={styles.faqQuestionText}>{faq.question}</span>
                  <ChevronRight
                    className={clsx(styles.faqChevron, openFaq === idx && styles.faqChevronOpen)}
                  />
                </button>
                {openFaq === idx ? (
                  <div className={styles.faqAnswer}>
                    {faq.answer}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
