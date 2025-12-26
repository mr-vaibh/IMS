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

  useEffect(() => {
    const opts = warehouses.map((w) => ({
      value: w.id,
      label: w.code ? `${w.name} (${w.code})` : w.name,
    }));
    setOptions(opts);

    const found = opts.find((o) => o.value === value) || null;
    setSelected(found);
  }, [warehouses, value]);

  async function handleCreate(inputValue: string) {
    const res = await apiFetchClient("/warehouses", {
      method: "POST",
      body: JSON.stringify({ name: inputValue }),
    });

    const newOption: Option = {
      value: res.id,
      label: res.code ? `${res.name} (${res.code})` : res.name,
    };

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
