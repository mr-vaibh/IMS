"use client";

import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { apiFetchClient } from "@/lib/api.client";

interface Product {
  id: string;
  name: string;
  sku: string;
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
    setOptions((prev) => {
      const base = products.map((p) => ({
        value: p.id,
        label: `${p.name}`,
      }));

      // keep locally created options
      const merged = [
        ...base,
        ...prev.filter(
          (o) => !base.some((b) => b.value === o.value)
        ),
      ];

      return merged;
    });
  }, [products]);

  useEffect(() => {
    setSelected((prev) => {
      return (
        options.find((o) => o.value === value) ?? prev
      );
    });
  }, [value, options]);

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
