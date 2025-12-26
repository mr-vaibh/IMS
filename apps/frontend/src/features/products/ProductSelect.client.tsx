"use client";

import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { apiFetchClient } from "@/lib/api.client";

interface Product {
  id: string;
  name: string;
}

interface Option {
  value: string;
  label: string;
}

interface Props {
  products: Product[];
  value: string;
  onChange: (id: string) => void;
}

export default function ProductSelect({
  products,
  value,
  onChange,
}: Props) {
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<Option | null>(null);

  // sync options
  useEffect(() => {
    const opts = products.map((p) => ({
      value: p.id,
      label: p.name,
    }));
    setOptions(opts);

    const found = opts.find((o) => o.value === value) || null;
    setSelected(found);
  }, [products, value]);

  async function handleCreate(inputValue: string) {
    const res = await apiFetchClient("/products", {
      method: "POST",
      body: JSON.stringify({ name: inputValue }),
    });

    const newOption: Option = {
      value: res.id,
      label: res.name,
    };

    // critical: add option AND select same object
    setOptions((prev) => [...prev, newOption]);
    setSelected(newOption);
    onChange(res.id);
  }

  return (
    <CreatableSelect
      placeholder="Search or create product…"
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
