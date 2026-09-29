const fs = require('fs'); 
let code = fs.readFileSync('resources/js/Pages/Dashboard.tsx', 'utf8'); 

code = code.replace("import Card, { CardHeader } from '@/Components/Card';", "import Card, { CardHeader } from '@/Components/Card';\nimport MobileDashboard from '@/Components/MobileDashboard';"); 

code = code.replace('<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">', '<div className="hidden lg:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">'); 

code = code.replace('<div className="flex flex-col space-y-6">', `<div className="block lg:hidden w-full -mx-4 -mt-6 sm:mx-0 sm:mt-0">
                <MobileDashboard 
                    stats={stats} 
                    studentsPerClass={studentsPerClass} 
                    chartData={chartData} 
                    activeUsers={activeUsers} 
                    lastLogins={lastLogins} 
                    inventoryStats={inventoryStats} 
                    attendanceRanking={attendanceRanking} 
                    assessmentRanking={assessmentRanking} 
                    activeSemester={activeSemester} 
                />
            </div>

            <div className="hidden lg:flex flex-col space-y-6">`); 

fs.writeFileSync('resources/js/Pages/Dashboard.tsx', code);
