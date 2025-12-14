import { redirect } from "next/navigation";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { getSession } from "@/lib/session";
import { getSchools } from "@/modules/schools/actions";
import { countTeachers } from "@/modules/teachers/actions";
import { countCourses } from "@/modules/courses/actions";
import { countSchedules } from "@/modules/schedules/actions";
import "../../dashboard.css";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Obtener colegios del usuario
  let schools = [];
  let teachersCount = 0;
  let coursesCount = 0;
  let schedulesCount = 0;

  try {
    schools = await getSchools();
    teachersCount = await countTeachers();
    coursesCount = await countCourses();
    schedulesCount = await countSchedules();
  } catch (error) {
    console.error("Error al obtener datos:", error);
  }

  const quickActions = [
    {
      icon: "🏫",
      title: "Colegios",
      description: "Gestiona instituciones",
      href: "/schools",
    },
    {
      icon: "👨‍🏫",
      title: "Profesores",
      description: "Administra profesores",
      href: "/teachers",
    },
    {
      icon: "📚",
      title: "Asignaturas",
      description: "Catálogo de materias",
      href: "/subjects",
    },
    {
      icon: "🎓",
      title: "Cursos",
      description: "Cursos y secciones",
      href: "/courses",
    },
    {
      icon: "🗓️",
      title: "Horarios",
      description: "Gestiona horarios",
      href: "/schedules",
    },
    {
      icon: "📊",
      title: "Reportes",
      description: "Estadísticas y análisis",
      href: "/reports",
    },
  ];

  const stats = [
    { label: "Colegios", value: schools.length.toString(), icon: "🏫" },
    { label: "Profesores", value: teachersCount.toString(), icon: "👨‍🏫" },
    { label: "Cursos", value: coursesCount.toString(), icon: "🎓" },
    { label: "Horarios", value: schedulesCount.toString(), icon: "🗓️" },
  ];

  return (
    <div className="dashboard-page">
      {/* Background */}
      <div className="dashboard-bg">
        <div className="dashboard-gradient"></div>
        <div className="dashboard-orb dashboard-orb-1"></div>
        <div className="dashboard-orb dashboard-orb-2"></div>
      </div>

      {/* Main Content */}
      <main className="dashboard-main">
        {schools.length === 0 ? (
          /* Primera vez - No hay colegios */
          <div className="dashboard-welcome">
            <h1 className="dashboard-title">
              ¡Bienvenido a {siteConfig.name}!
            </h1>
            <p className="dashboard-subtitle">
              Comienza creando tu primer colegio
            </p>
            <div style={{ marginTop: "2rem" }}>
              <Link
                href="/schools"
                className="dashboard-action-card"
                style={{ display: "inline-block", maxWidth: "400px" }}
              >
                <div className="dashboard-action-icon">🏫</div>
                <h3 className="dashboard-action-title">
                  Crear Mi Primer Colegio
                </h3>
                <p className="dashboard-action-description">
                  Configura tu institución educativa y comienza a gestionar
                  horarios
                </p>
              </Link>
            </div>
          </div>
        ) : (
          /* Usuario con colegios */
          <>
            {/* Welcome Section */}
            <div className="dashboard-welcome">
              <h1 className="dashboard-title">
                Bienvenido a tu panel de control
              </h1>
              <p className="dashboard-subtitle">
                Gestiona todo tu sistema educativo desde aquí
              </p>
            </div>

            {/* Stats Cards */}
            <div className="dashboard-stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="dashboard-stat-card">
                  <div className="dashboard-stat-content">
                    <div className="dashboard-stat-info">
                      <p className="dashboard-stat-label">{stat.label}</p>
                      <p className="dashboard-stat-value">{stat.value}</p>
                    </div>
                    <div className="dashboard-stat-icon">{stat.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="dashboard-section-title">Acceso Rápido</h2>
              <div className="dashboard-actions-grid">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className="dashboard-action-card"
                  >
                    <div className="dashboard-action-icon">{action.icon}</div>
                    <h3 className="dashboard-action-title">{action.title}</h3>
                    <p className="dashboard-action-description">
                      {action.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="dashboard-section-title">Actividad Reciente</h2>
              <div className="dashboard-activity-card">
                <div className="dashboard-empty-state">
                  <div className="dashboard-empty-icon">📊</div>
                  <p className="dashboard-empty-title">
                    No hay actividad reciente
                  </p>
                  <p className="dashboard-empty-subtitle">
                    Comienza creando un colegio o agregando profesores
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
