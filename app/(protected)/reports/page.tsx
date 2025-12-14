import { Container, PageHeader } from "@/components/layout";
import { Card, CardContent, Badge } from "@/components/ui";

export default function ReportsPage() {
  return (
    <Container>
      <PageHeader
        title="📊 Reportes y Estadísticas"
        description="Visualiza estadísticas y genera reportes sobre la carga horaria y distribución de recursos."
      />

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon="🏫" label="Colegios" value="3" color="primary" />
        <StatCard icon="👨‍🏫" label="Profesores" value="87" color="secondary" />
        <StatCard icon="🎓" label="Cursos" value="42" color="accent" />
        <StatCard icon="📚" label="Asignaturas" value="18" color="success" />
      </div>

      {/* Reportes disponibles */}
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">
        Reportes Disponibles
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportCard
          title="Carga Horaria por Profesor"
          description="Horas semanales asignadas a cada profesor y distribución por asignatura."
          tags={["PDF", "Excel"]}
        />
        <ReportCard
          title="Ocupación de Salas"
          description="Uso de aulas y espacios físicos por día y horario."
          tags={["PDF"]}
        />
        <ReportCard
          title="Conflictos de Horario"
          description="Lista de conflictos detectados que requieren resolución."
          tags={["PDF", "Email"]}
        />
        <ReportCard
          title="Distribución de Asignaturas"
          description="Análisis de la distribución de materias por nivel y sección."
          tags={["PDF", "Excel"]}
        />
      </div>
    </Container>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  color: "primary" | "secondary" | "accent" | "success";
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    primary: "from-primary-400 to-primary-600",
    secondary: "from-secondary-400 to-secondary-600",
    accent: "from-accent-400 to-accent-600",
    success: "from-success-400 to-success-600",
  };

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-xl bg-linear-to-br ${colorClasses[color]} flex items-center justify-center text-2xl shadow-md`}
          >
            {icon}
          </div>
          <div>
            <div className="text-3xl font-bold text-neutral-900">{value}</div>
            <div className="text-sm text-neutral-600">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReportCardProps {
  title: string;
  description: string;
  tags: string[];
}

function ReportCard({ title, description, tags }: ReportCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent>
        <h3 className="text-lg font-bold text-neutral-900 mb-2">{title}</h3>
        <p className="text-sm text-neutral-600 mb-4">{description}</p>
        <div className="flex gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="neutral" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
