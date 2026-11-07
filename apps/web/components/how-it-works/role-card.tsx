import { CheckIcon } from "@/components/how-it-works/icons";

function ChecklistGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground">{title}</h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm">
            <CheckIcon className="mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleCard({
  title,
  onceTitle,
  onceItems,
  eachTitle,
  eachItems,
  note,
}: {
  title: string;
  onceTitle: string;
  onceItems: string[];
  eachTitle: string;
  eachItems: string[];
  note: string;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <ChecklistGroup title={onceTitle} items={onceItems} />
      <ChecklistGroup title={eachTitle} items={eachItems} />
      <p className="mt-auto text-sm text-muted-foreground">{note}</p>
    </article>
  );
}

export { RoleCard };
