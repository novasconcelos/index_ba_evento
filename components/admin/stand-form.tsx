import Link from "next/link";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { STAND_STATUSES } from "@/lib/enums";
import { standStatusLabel } from "@/lib/labels";
import { formatBRL } from "@/lib/utils";

interface StandLike {
  id: string;
  code: string;
  segment: string | null;
  sector: string | null;
  sizeM2: number | null;
  priceCents: number;
  status: string;
  svgShapeId: string | null;
  positionLabel: string | null;
}

export function StandForm({
  action,
  stand,
}: {
  action: (formData: FormData) => void;
  stand?: StandLike;
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      {stand && <input type="hidden" name="id" value={stand.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="code">Código *</Label>
          <Input id="code" name="code" required defaultValue={stand?.code} />
        </div>
        <div>
          <Label htmlFor="svgShapeId">ID da forma no SVG</Label>
          <Input
            id="svgShapeId"
            name="svgShapeId"
            defaultValue={stand?.svgShapeId ?? ""}
            placeholder="ex.: H1"
          />
        </div>
        <div>
          <Label htmlFor="segment">Segmento</Label>
          <Input
            id="segment"
            name="segment"
            defaultValue={stand?.segment ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="sector">Setor</Label>
          <Input id="sector" name="sector" defaultValue={stand?.sector ?? ""} />
        </div>
        <div>
          <Label htmlFor="sizeM2">Metragem (m²)</Label>
          <Input
            id="sizeM2"
            name="sizeM2"
            type="number"
            defaultValue={stand?.sizeM2 ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="price">Valor (R$)</Label>
          <Input
            id="price"
            name="price"
            defaultValue={stand ? formatBRL(stand.priceCents) : ""}
            placeholder="R$ 0,00"
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            defaultValue={stand?.status ?? "AVAILABLE"}
          >
            {STAND_STATUSES.map((s) => (
              <option key={s} value={s}>
                {standStatusLabel[s]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="positionLabel">Localização</Label>
          <Input
            id="positionLabel"
            name="positionLabel"
            defaultValue={stand?.positionLabel ?? ""}
          />
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit">Salvar</Button>
        <Link href="/admin/stands">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}
