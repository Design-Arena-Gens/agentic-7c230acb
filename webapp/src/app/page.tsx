"use client";

import Image from "next/image";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type Entry = {
  id: string;
  plateNumber: string;
  withLoadKg: number;
  withoutLoadKg: number;
  netWeightKg: number;
  date: string;
  price: number;
  checkNumber: string;
};

type FormShape = {
  plateNumber: string;
  withLoadKg: string;
  withoutLoadKg: string;
  date: string;
  price: string;
  checkNumber: string;
};

const initialFormState = (): FormShape => ({
  plateNumber: "",
  withLoadKg: "",
  withoutLoadKg: "",
  date: new Date().toISOString().split("T")[0],
  price: "30000",
  checkNumber: "",
});

const camelBackgroundOverlay =
  "bg-gradient-to-br from-amber-900/70 via-zinc-900/80 to-black/80";

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [form, setForm] = useState<FormShape>(() => initialFormState());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [alarmTick, setAlarmTick] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const plateInputRef = useRef<HTMLInputElement | null>(null);
  const alarmActive = true;

  useEffect(() => {
    const interval = setInterval(() => {
      setAlarmTick((prev) => !prev);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const netWeight = useMemo(() => {
    const withLoad = Number(form.withLoadKg);
    const withoutLoad = Number(form.withoutLoadKg);
    if (Number.isFinite(withLoad) && Number.isFinite(withoutLoad)) {
      return Math.max(withLoad - withoutLoad, 0);
    }
    return 0;
  }, [form.withLoadKg, form.withoutLoadKg]);

  const entryMatchesSearch = (entry: Entry) => {
    if (!normalizedSearch) return false;
    const combined = [
      entry.plateNumber,
      entry.date,
      entry.price,
      entry.withLoadKg,
      entry.withoutLoadKg,
      entry.netWeightKg,
      entry.checkNumber,
    ]
      .join(" ")
      .toLowerCase();
    return combined.includes(normalizedSearch);
  };

  const displayedEntries = normalizedSearch
    ? entries.filter((entry) => entryMatchesSearch(entry))
    : entries;

  const handleFormChange =
    (field: keyof FormShape) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const resetForm = () => {
    setForm(initialFormState());
    setEditingId(null);
    setTimeout(() => plateInputRef.current?.focus(), 0);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const plateNumber = form.plateNumber.trim();
    if (!plateNumber) {
      plateInputRef.current?.focus();
      return;
    }

    const withLoadKg = Number(form.withLoadKg) || 0;
    const withoutLoadKg = Number(form.withoutLoadKg) || 0;
    const price = Number(form.price) || 0;
    const nextEntry: Entry = {
      id: editingId ?? crypto.randomUUID(),
      plateNumber,
      withLoadKg,
      withoutLoadKg,
      netWeightKg: Math.max(withLoadKg - withoutLoadKg, 0),
      date: form.date,
      price,
      checkNumber: form.checkNumber.trim(),
    };

    setEntries((prev) => {
      if (editingId) {
        return prev.map((entry) =>
          entry.id === editingId ? { ...nextEntry } : entry,
        );
      }
      return [nextEntry, ...prev];
    });
    resetForm();
  };

  const handleEdit = (entry: Entry) => {
    setEditingId(entry.id);
    setForm({
      plateNumber: entry.plateNumber,
      withLoadKg: entry.withLoadKg.toString(),
      withoutLoadKg: entry.withoutLoadKg.toString(),
      date: entry.date,
      price: entry.price.toString(),
      checkNumber: entry.checkNumber,
    });
    setTimeout(() => plateInputRef.current?.focus(), 0);
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (editingId === id) {
      resetForm();
    }
  };

  const highlightMatches = (text: string | number) => {
    const rawText = String(text);
    if (!normalizedSearch) {
      return rawText;
    }
    const index = rawText.toLowerCase().indexOf(normalizedSearch);
    if (index === -1) {
      return rawText;
    }
    const before = rawText.substring(0, index);
    const match = rawText.substring(index, index + normalizedSearch.length);
    const after = rawText.substring(index + normalizedSearch.length);
    return (
      <>
        {before}
        <span className="text-red-400">{match}</span>
        {after}
      </>
    );
  };

  return (
    <div className="min-h-screen w-full px-4 py-10 sm:px-8 lg:px-16">
      <div
        className={`backdrop-layer mx-auto flex max-w-6xl flex-col gap-8 rounded-3xl p-6 sm:p-10 ${camelBackgroundOverlay}`}
      >
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/camel-logo.svg"
              alt="Camel caravan logo"
              width={120}
              height={48}
              priority
            />
            <div>
              <h1 className="text-2xl font-semibold text-amber-200 sm:text-3xl">
                Caravan Weight Log
              </h1>
              <p className="text-sm text-amber-100/70">
                Add · Delete · Edit · Relay · Print · Reload
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 text-amber-200/80">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M21 12.79A9 9 0 1111.21 3c.53 0 .96.43.96.96 0 3.71 3.12 6.83 6.83 6.83.53 0 .96.43.96.96z" />
                </svg>
              </span>
              <input
                className="w-full rounded-full border border-amber-300/30 bg-amber-50/10 py-2 pl-10 pr-4 text-sm text-amber-50 placeholder:text-amber-200/50 focus:border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-200/60 sm:w-64"
                placeholder="Search caravan data"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.print();
                  }
                }}
                className="rounded-full border border-amber-300/40 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-400/20"
              >
                Print
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.reload();
                  }
                }}
                className="rounded-full border border-amber-300/40 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-400/20"
              >
                Reload
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-amber-400/30 bg-amber-950/30 p-4">
            <h2 className="text-sm uppercase tracking-wide text-amber-200/80">
              Active Alarm
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${
                  alarmActive && alarmTick ? "bg-red-400 shadow-[0_0_12px] shadow-red-400/80" : "bg-red-700/60"
                } transition`}
              />
              <p className="text-sm font-semibold text-red-200">
                Alarm status: {alarmActive ? "Monitoring" : "Offline"}
              </p>
            </div>
            <p className="mt-2 text-xs text-amber-100/60">
              Caravan alerts pulse continuously while active.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-400/30 bg-amber-950/30 p-4">
            <h2 className="text-sm uppercase tracking-wide text-amber-200/80">
              Summa
            </h2>
            <p className="mt-3 text-3xl font-semibold text-amber-100">30,000</p>
            <p className="text-xs text-amber-200/70">Baseline tariff</p>
          </div>
          <div className="rounded-2xl border border-amber-400/30 bg-amber-950/30 p-4">
            <h2 className="text-sm uppercase tracking-wide text-amber-200/80">
              Summa
            </h2>
            <p className="mt-3 text-3xl font-semibold text-amber-100">40,000</p>
            <p className="text-xs text-amber-200/70">Premium tariff</p>
          </div>
          <div className="rounded-2xl border border-amber-400/30 bg-amber-950/30 p-4">
            <h2 className="text-sm uppercase tracking-wide text-amber-200/80">
              Relay Control
            </h2>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => {
                  plateInputRef.current?.focus();
                }}
                className="rounded-full border border-amber-400/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-100 hover:bg-amber-400/20"
              >
                Relay
              </button>
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="rounded-full border border-amber-400/10 bg-amber-50/10 px-4 py-2 text-xs text-amber-100 hover:bg-amber-400/20"
              >
                Clear Search
              </button>
            </div>
            <p className="mt-2 text-xs text-amber-100/60">
              Quickly jump to data entry or reset filters.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-amber-400/40 bg-amber-950/40 p-6">
          <form
            id="entry-form"
            ref={formRef}
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <label className="flex flex-col gap-2 text-sm text-amber-100">
              <span>Plate Number</span>
              <input
                ref={plateInputRef}
                required
                value={form.plateNumber}
                onChange={handleFormChange("plateNumber")}
                className="rounded-xl border border-amber-500/30 bg-black/20 px-4 py-3 text-amber-50 placeholder:text-amber-200/50 focus:border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-200/60"
                placeholder="34Z 999 FA"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-amber-100">
              <span>Yuk bilan (Kg)</span>
              <input
                type="number"
                min={0}
                value={form.withLoadKg}
                onChange={handleFormChange("withLoadKg")}
                className="rounded-xl border border-amber-500/30 bg-black/20 px-4 py-3 text-amber-50 placeholder:text-amber-200/50 focus:border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-200/60"
                placeholder="40000"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-amber-100">
              <span>Yuksiz (Kg)</span>
              <input
                type="number"
                min={0}
                value={form.withoutLoadKg}
                onChange={handleFormChange("withoutLoadKg")}
                className="rounded-xl border border-amber-500/30 bg-black/20 px-4 py-3 text-amber-50 placeholder:text-amber-200/50 focus:border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-200/60"
                placeholder="32000"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-amber-100">
              <span>Sof Vazin (Kg)</span>
              <input
                type="text"
                value={Number.isFinite(netWeight) ? netWeight.toString() : "0"}
                readOnly
                className="rounded-xl border border-amber-500/30 bg-black/30 px-4 py-3 text-amber-200 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-amber-100">
              <span>Date</span>
              <input
                type="date"
                value={form.date}
                onChange={handleFormChange("date")}
                className="rounded-xl border border-amber-500/30 bg-black/20 px-4 py-3 text-amber-50 focus:border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-200/60"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-amber-100">
              <span>Summa (Price)</span>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={handleFormChange("price")}
                className="rounded-xl border border-amber-500/30 bg-black/20 px-4 py-3 text-amber-50 placeholder:text-amber-200/50 focus:border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-200/60"
                placeholder="30000"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-amber-100">
              <span>Add-on Check Number</span>
              <input
                value={form.checkNumber}
                onChange={handleFormChange("checkNumber")}
                className="rounded-xl border border-amber-500/30 bg-black/20 px-4 py-3 text-amber-50 placeholder:text-amber-200/50 focus:border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-200/60"
                placeholder="CHK-2024-001"
              />
            </label>
            <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-xl bg-amber-400/90 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-zinc-900 transition hover:bg-amber-300"
                >
                  {editingId ? "Update Entry" : "Add Entry"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-amber-400/40 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-amber-100 transition hover:bg-amber-400/20"
                >
                  Reset Form
                </button>
              </div>
              <p className="text-xs text-amber-100/70">
                Sof Vazin automatically recalculates from Yuk bilan − Yuksiz.
              </p>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-amber-400/40 bg-amber-950/40 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-amber-100">
              Caravan Entries
            </h2>
            <p className="text-sm text-amber-100/70">
              {normalizedSearch
                ? `Showing ${displayedEntries.length} result(s) in red`
                : `Total entries: ${entries.length}`}
            </p>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm text-amber-100">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-amber-200/70">
                  <th className="border-b border-amber-400/20 px-4 py-3">
                    Plate_Number
                  </th>
                  <th className="border-b border-amber-400/20 px-4 py-3">
                    Yuk_bilan (Kg)
                  </th>
                  <th className="border-b border-amber-400/20 px-4 py-3">
                    Sana (Date)
                  </th>
                  <th className="border-b border-amber-400/20 px-4 py-3">
                    Yuksiz (Kg)
                  </th>
                  <th className="border-b border-amber-400/20 px-4 py-3">
                    Sof_Vazin (Kg)
                  </th>
                  <th className="border-b border-amber-400/20 px-4 py-3">
                    Price
                  </th>
                  <th className="border-b border-amber-400/20 px-4 py-3">
                    Check No.
                  </th>
                  <th className="border-b border-amber-400/20 px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-sm text-amber-100/60"
                    >
                      {normalizedSearch
                        ? "No matching records found."
                        : "Add entries to populate the caravan table."}
                    </td>
                  </tr>
                ) : (
                  displayedEntries.map((entry) => {
                    const highlight = normalizedSearch
                      ? entryMatchesSearch(entry)
                      : false;
                    return (
                      <tr
                        key={entry.id}
                        className={`transition ${highlight ? "bg-red-400/10" : "odd:bg-black/10"}`}
                      >
                        <td className={`px-4 py-3 ${highlight ? "text-red-400" : "text-amber-50"}`}>
                          {highlight ? highlightMatches(entry.plateNumber) : entry.plateNumber}
                        </td>
                        <td className={`px-4 py-3 ${highlight ? "text-red-400" : "text-amber-50"}`}>
                          {highlight
                            ? highlightMatches(entry.withLoadKg)
                            : entry.withLoadKg.toLocaleString()}
                        </td>
                        <td className={`px-4 py-3 ${highlight ? "text-red-400" : "text-amber-50"}`}>
                          {highlight ? highlightMatches(entry.date) : entry.date}
                        </td>
                        <td className={`px-4 py-3 ${highlight ? "text-red-400" : "text-amber-50"}`}>
                          {highlight
                            ? highlightMatches(entry.withoutLoadKg)
                            : entry.withoutLoadKg.toLocaleString()}
                        </td>
                        <td className={`px-4 py-3 ${highlight ? "text-red-400" : "text-amber-50"}`}>
                          {highlight
                            ? highlightMatches(entry.netWeightKg)
                            : entry.netWeightKg.toLocaleString()}
                        </td>
                        <td className={`px-4 py-3 ${highlight ? "text-red-400" : "text-amber-50"}`}>
                          {highlight
                            ? highlightMatches(entry.price)
                            : entry.price.toLocaleString()}
                        </td>
                        <td className={`px-4 py-3 ${highlight ? "text-red-400" : "text-amber-50"}`}>
                          {highlight
                            ? highlightMatches(entry.checkNumber || "—")
                            : entry.checkNumber || "—"}
                        </td>
                        <td className="px-4 py-3 text-amber-100">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(entry)}
                              className="rounded-full border border-amber-300/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-100 hover:bg-amber-400/20"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(entry.id)}
                              className="rounded-full border border-red-400/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-200 hover:bg-red-500/20"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
