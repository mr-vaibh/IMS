"use client";

import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { apiFetchClient } from "@/lib/api.client";

interface Warehouse {
  id: string;
  name: string;
  code?: string;
}

interface Option {
  value: string;
  label: string;
}

interface Props {
  warehouses: Warehouse[];
  value: string;
  onChange: (id: string) => void;
}

export default function WarehouseSelect({
  warehouses,
  value,
  onChange,
}: Props) {
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<Option | null>(null);

  // 🔹 Sync backend warehouses → options (MERGE, don’t replace)
  useEffect(() => {
    setOptions((prev) => {
      const base = warehouses.map((w) => ({
        value: w.id,
        label: `${w.name} (${w.code})`
      }));

      const merged = [
        ...base,
        ...prev.filter(
          (o) => !base.some((b) => b.value === o.value)
        ),
      ];

      return merged;
    });
  }, [warehouses]);

  // 🔹 Sync selected from value (SOURCE = options)
  useEffect(() => {
    setSelected((prev) => {
      return options.find((o) => o.value === value) ?? prev;
    });
  }, [value, options]);

  async function handleCreate(inputValue: string) {
    const res = await apiFetchClient("/warehouses", {
      method: "POST",
      body: JSON.stringify({ name: inputValue }),
    });

    const newOption: Option = {
      value: res.id,
      label: `${res.name} (${res.code})`,
    };

    // 🔥 critical: add option AND select the SAME object
    setOptions((prev) => [...prev, newOption]);
    setSelected(newOption);
    onChange(res.id);
  }

  return (
    <CreatableSelect
      placeholder="Search or create warehouse…"
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
