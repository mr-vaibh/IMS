"use client";

import { useEffect, useState } from "react";
import Select from "react-select";
import { apiFetchClient } from "@/lib/api.client";

interface Company {
  id: string;
  name: string;
  created_by_me: boolean;
}

interface Option {
  value: string;
  label: string;
  created_by_me: boolean;
}

interface Props {
  value: string;
  onChange: (id: string) => void;
}

export default function CompanySelect({ value, onChange }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetchClient("/companies")
      .then((res) => {
        const list = res.items ?? res ?? [];
        setCompanies(list);

        // ✅ auto-select first company if none selected
        if (!value && list.length > 0) {
          onChange(list[0].id);
        }
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  const options: Option[] = companies.map((c) => ({
    value: c.id,
    label: c.name,
    created_by_me: c.created_by_me,
  }));

  if (loading) {
    return (
      <div className="border p-2 text-sm text-gray-500">
        Loading companies…
      </div>
    );
  }

  return (
    <Select
      options={options}
      value={options.find((o) => o.value === value) || null}
      onChange={(opt) => onChange(opt?.value || "")}
      placeholder={
        options.length === 0
          ? "No company exists for you"
          : "Select company…"
      }
      isClearable={options.length > 0}
      isDisabled={options.length === 0}
    />
  );
}
