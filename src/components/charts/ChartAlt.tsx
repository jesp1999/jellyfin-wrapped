// Text version of a chart for screen readers: a caption and, for small charts, the values as a table.
export function ChartAlt({ caption, rows }: { caption: string; rows?: [string, string][] }) {
  if (!rows?.length) return <p className="wrapped-sr-only">{caption}</p>;
  return (
    <table className="wrapped-sr-only">
      <caption>{caption}</caption>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
