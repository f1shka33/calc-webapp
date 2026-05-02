"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDownToLine, ArrowUpRight, Gamepad2, Receipt, Repeat } from "lucide-react";
import { ConvertModal, DepositModal, SendModal } from "./DepositSendModals";

export function QuickActions() {
  const [deposit, setDeposit] = useState(false);
  const [send, setSend] = useState(false);
  const [convert, setConvert] = useState(false);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <Link href="/games" className="btn-primary w-full">
          <Gamepad2 className="w-4 h-4" /> Play
        </Link>
        <Link href="/transactions" className="btn-ghost w-full">
          <Receipt className="w-4 h-4" /> Transactions
        </Link>
        <button className="btn-ghost w-full" onClick={() => setDeposit(true)}>
          <ArrowDownToLine className="w-4 h-4" /> Deposit
        </button>
        <button className="btn-ghost w-full" onClick={() => setSend(true)}>
          <ArrowUpRight className="w-4 h-4" /> Send
        </button>
        <button className="btn-ghost w-full" onClick={() => setConvert(true)}>
          <Repeat className="w-4 h-4" /> Convert
        </button>
      </div>
      <DepositModal open={deposit} onClose={() => setDeposit(false)} />
      <SendModal open={send} onClose={() => setSend(false)} />
      <ConvertModal open={convert} onClose={() => setConvert(false)} />
    </>
  );
}
