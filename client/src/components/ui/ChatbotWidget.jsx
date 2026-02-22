import React, { useState } from 'react';

const faq = [
  {
    q: 'How do I book a stay?',
    a: 'Open a listing, choose dates and guests, then click Book to confirm your stay.',
  },
  {
    q: 'Can I cancel my booking?',
    a: 'Yes. Cancellation policies vary by property. Check the listing details before booking.',
  },
  {
    q: 'How do I contact a host?',
    a: 'Open the listing and use the Contact Host button to send a message.',
  },
  {
    q: 'Is payment secure?',
    a: 'Yes, payments are processed securely and your details are protected.',
  },
];

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I am SpaceBook Assistant. Ask me about hidden gems in India.' },
  ]);
  const [input, setInput] = useState('');

  const getReply = (text) => {
    const match = faq.find((item) => item.q.toLowerCase().includes(text));
    if (match) return match.a;
    if (text.includes('book')) return 'To book, open a listing and select your dates.';
    if (text.includes('cancel')) return 'Check the cancellation policy in the listing details.';
    if (text.includes('price')) return 'Prices vary by dates and availability. Check the listing.';
    return 'I can help with bookings, cancellations, payments, or contacting hosts.';
  };

  const handleSend = () => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;
    const reply = getReply(trimmed);
    setMessages((prev) => [...prev, { from: 'user', text: input }, { from: 'bot', text: reply }]);
    setInput('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 w-80 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between rounded-t-2xl bg-[#0B1220]/80 px-4 py-3 text-white border-b border-white/10">
            <span className="font-light">SpaceBook Assistant</span>
            <button onClick={() => setOpen(false)} className="text-[#E5E7EB]">
              ✕
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={`${msg.from}-${idx}`}
                className={`rounded-xl px-3 py-2 text-sm ${
                  msg.from === 'user'
                    ? 'ml-auto bg-[#C9A96E]/15 text-[#E5E7EB]'
                    : 'mr-auto bg-white/5 text-[#E5E7EB]/80'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-white/10 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => (e.key === 'Enter' ? handleSend() : null)}
              placeholder="Ask me anything..."
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#E5E7EB] placeholder-[#E5E7EB]/40 focus:outline-none"
            />
            <button
              onClick={handleSend}
              className="rounded-full bg-gradient-to-r from-[#C9A96E] to-[#D4B896] px-4 py-2 text-sm text-[#0B1220] font-semibold"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#C9A96E] to-[#D4B896] text-[#0B1220] shadow-lg"
        aria-label="Open chatbot"
      >
        💬
      </button>
    </div>
  );
};

export default ChatbotWidget;