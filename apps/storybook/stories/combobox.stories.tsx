import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "@workspace/ui/components/combobox";

interface Fruit {
  label: string;
  value: string;
}

const fruits: Fruit[] = [
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
  { label: "Orange", value: "orange" },
  { label: "Pineapple", value: "pineapple" },
  { label: "Grape", value: "grape" },
  { label: "Mango", value: "mango" },
  { label: "Strawberry", value: "strawberry" },
];

interface Language {
  label: string;
  value: string;
}

const languages: Language[] = [
  { label: "TypeScript", value: "typescript" },
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "Rust", value: "rust" },
  { label: "Go", value: "go" },
];

interface ProduceGroup {
  value: string;
  items: Fruit[];
}

const groupedProduce: ProduceGroup[] = [
  {
    value: "Fruits",
    items: [
      { label: "Apple", value: "apple" },
      { label: "Banana", value: "banana" },
      { label: "Orange", value: "orange" },
    ],
  },
  {
    value: "Vegetables",
    items: [
      { label: "Carrot", value: "carrot" },
      { label: "Broccoli", value: "broccoli" },
      { label: "Spinach", value: "spinach" },
    ],
  },
];

const meta = {
  title: "Components/Combobox",
  component: Combobox,
} satisfies Meta<typeof Combobox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Combobox items={fruits} defaultOpen>
      <ComboboxInput placeholder="Search fruit..." />
      <ComboboxContent>
        <ComboboxEmpty>No fruit found.</ComboboxEmpty>
        <ComboboxList>
          {(item: Fruit) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};

export const WithClearButton: Story = {
  render: () => (
    <Combobox items={fruits} defaultValue={fruits[0]} defaultOpen>
      <ComboboxInput placeholder="Search fruit..." showClear />
      <ComboboxContent>
        <ComboboxEmpty>No fruit found.</ComboboxEmpty>
        <ComboboxList>
          {(item: Fruit) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};

export const Grouped: Story = {
  render: () => (
    <Combobox items={groupedProduce} defaultOpen>
      <ComboboxInput placeholder="Search produce..." />
      <ComboboxContent>
        <ComboboxEmpty>No produce found.</ComboboxEmpty>
        <ComboboxList>
          {(group: ProduceGroup) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              <ComboboxCollection>
                {(item: Fruit) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};

function MultipleSelectionDemo() {
  const anchor = useComboboxAnchor();

  return (
    <Combobox items={languages} multiple defaultValue={[languages[0]!, languages[1]!]} defaultOpen>
      <ComboboxChips ref={anchor}>
        <ComboboxValue>
          {(value: Language[]) => (
            <>
              {value.map((language) => (
                <ComboboxChip key={language.value}>{language.label}</ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder={value.length > 0 ? "" : "e.g. TypeScript"} />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No languages found.</ComboboxEmpty>
        <ComboboxList>
          {(language: Language) => (
            <ComboboxItem key={language.value} value={language}>
              {language.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export const MultipleSelection: Story = {
  render: () => <MultipleSelectionDemo />,
};

export const Empty: Story = {
  render: () => (
    <Combobox items={fruits} defaultInputValue="zzz" defaultOpen>
      <ComboboxInput placeholder="Search fruit..." />
      <ComboboxContent>
        <ComboboxEmpty>No fruit found.</ComboboxEmpty>
        <ComboboxList>
          {(item: Fruit) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};

export const DisabledItem: Story = {
  render: () => (
    <Combobox items={fruits} defaultOpen>
      <ComboboxInput placeholder="Search fruit..." />
      <ComboboxContent>
        <ComboboxEmpty>No fruit found.</ComboboxEmpty>
        <ComboboxList>
          {(item: Fruit) => (
            <ComboboxItem key={item.value} value={item} disabled={item.value === "banana"}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};

export const TriggerButton: Story = {
  render: () => (
    <Combobox items={fruits} defaultValue={fruits[0]}>
      <ComboboxTrigger className="w-48 justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm">
        <ComboboxValue placeholder="Select a fruit..." />
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput placeholder="Search fruit..." showTrigger={false} />
        <ComboboxEmpty>No fruit found.</ComboboxEmpty>
        <ComboboxList>
          <ComboboxItem value={fruits[0]}>{fruits[0]!.label}</ComboboxItem>
          <ComboboxItem value={fruits[1]}>{fruits[1]!.label}</ComboboxItem>
          <ComboboxSeparator />
          <ComboboxItem value={fruits[2]}>{fruits[2]!.label}</ComboboxItem>
          <ComboboxItem value={fruits[3]}>{fruits[3]!.label}</ComboboxItem>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Combobox items={fruits} disabled>
      <ComboboxInput placeholder="Search fruit..." disabled />
      <ComboboxContent>
        <ComboboxEmpty>No fruit found.</ComboboxEmpty>
        <ComboboxList>
          {(item: Fruit) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
};
