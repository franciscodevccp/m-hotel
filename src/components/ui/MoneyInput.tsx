"use client";

import { formatNumber } from "@/lib/format";

interface MoneyInputProps {
  /** Valor numérico en CLP (0 se muestra como vacío). */
  value: number;
  onValueChange: (value: number) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Campo de dinero en pesos chilenos: muestra el separador de miles ("34.444")
 * mientras se escribe y entrega el número limpio. Sin decimales, nunca dólares.
 */
export function MoneyInput({ value, onValueChange, id, placeholder, className }: MoneyInputProps) {
  return (
    <input
      id={id}
      inputMode="numeric"
      value={value > 0 ? formatNumber(value) : ""}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        onValueChange(digits ? Number.parseInt(digits, 10) : 0);
      }}
      placeholder={placeholder}
      className={className}
    />
  );
}
