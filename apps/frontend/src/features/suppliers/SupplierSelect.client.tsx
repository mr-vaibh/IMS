"use client";

import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { apiFetchClient } from "@/lib/api.client";

interface Supplier {
  id: string;
  name: string;
}

interface Option {
  value: string;
  label: string;
}

export default function SupplierSelect({
  suppliers,
  value,
  onChange,
}: {
  suppliers: Supplier[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<Option | null>(null);

  // sync suppliers → options
  useEffect(() => {
    const base = suppliers.map((s) => ({
      value: s.id,
      label: s.name,
    }));

    setOptions((prev) => [
      ...base,
      ...prev.filter((o) => !base.some((b) => b.value === o.value)),
    ]);
  }, [suppliers]);

  // sync selected value
  useEffect(() => {
    setSelected(options.find((o) => o.value === value) || null);
  }, [value, options]);

  async function handleCreate(inputValue: string) {
    const res = await apiFetchClient("/suppliers", {
      method: "POST",
      body: JSON.stringify({ name: inputValue }),
    });

    const newOption = {
      value: res.id,
      label: res.name,
    };

    setOptions((prev) => [...prev, newOption]);
    setSelected(newOption);
    onChange(res.id);
  }

  return (
    <CreatableSelect
      placeholder="Select or add supplier…"
      options={options}
      value={selected}
      onChange={(opt) => {
        setSelected(opt as Option | null);
        onChange(opt?.value || "");
      }}
      onCreateOption={handleCreate}
      isClearable
    />
  );
}
