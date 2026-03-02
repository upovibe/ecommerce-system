<?php
// api/helpers/HelpSystem.php - Help system for CLI commands

class HelpSystem
{
    public static function showHelp()
    {
        echo "\n";
        echo "🚀 UPO-UI Framework - CLI Commands\n";
        echo "===================================\n\n";
        
        echo "Usage: php api/index.php [COMMAND]\n\n";
        
        echo "Available Commands:\n";
        echo "-------------------\n\n";
        
        echo "  --migrate                    Run all pending database migrations\n";
        echo "                               Creates/updates database tables\n\n";
        
        echo "  --seed                       Run all database seeders\n";
        echo "                               Populates database with default data\n\n";
        
        echo "  --migrate:seed               Run migrations then seeders\n";
        echo "                               Complete database setup in one command\n\n";
        
        echo "  --clear                      Clear all database tables\n";
        echo "                               ⚠️  WARNING: This will delete all data!\n\n";
        
        echo "  --fresh                      Fresh database setup\n";
        echo "                               Clears DB → Runs migrations → Seeds data\n\n";
        
        echo "  --email:user@example.com     Test email functionality\n";
        echo "                               Sends a test email to specified address\n\n";
        
        echo "  --db:check                    Test database connection\n";
        echo "                               Checks if the database is connected and accessible\n\n";
        
        echo "  --help, -h                   Show this help message\n\n";
        
        echo "Examples:\n";
        echo "---------\n";
        echo "  php api/index.php --help\n";
        echo "  php api/index.php --fresh\n";
        echo "  php api/index.php --migrate\n";
        echo "  php api/index.php --email:test@gmail.com\n\n";
        
        echo "Database Commands Explained:\n";
        echo "---------------------------\n";
        echo "• --migrate: Creates database tables and structure\n";
        echo "• --seed: Adds default data (admin users, settings, etc.)\n";
        echo "• --fresh: Complete reset - clears everything and starts fresh\n";
        echo "• --clear: Only removes all tables (use with caution)\n\n";
        
        echo "⚠️  Important Notes:\n";
        echo "• Always run from the project root directory\n";
        echo "• Database connection must be configured in config/database.php\n";
        echo "• --fresh is recommended for new installations\n";
        echo "• --clear will permanently delete all data\n\n";
    }

    public static function showCommandHelp($command = null)
    {
        if (!$command) {
            self::showHelp();
            return;
        }

        echo "\n";
        echo "📖 Help for command: $command\n";
        echo "============================\n\n";

        switch ($command) {
            case '--migrate':
                echo "Command: --migrate\n";
                echo "Purpose: Run all pending database migrations\n\n";
                echo "What it does:\n";
                echo "• Creates database tables based on migration files\n";
                echo "• Updates existing table structures\n";
                echo "• Tracks migration execution in the migrations table\n\n";
                echo "Usage:\n";
                echo "  php api/index.php --migrate\n\n";
                echo "Files affected:\n";
                echo "• api/database/migrations/*.php\n";
                echo "• Creates/updates database tables\n";
                break;

            case '--seed':
                echo "Command: --seed\n";
                echo "Purpose: Run all database seeders\n\n";
                echo "What it does:\n";
                echo "• Creates default admin users\n";
                echo "• Adds system settings and configurations\n";
                echo "• Populates default pages and content\n";
                echo "• Sets up initial application data\n\n";
                echo "Usage:\n";
                echo "  php api/index.php --seed\n\n";
                echo "Files affected:\n";
                echo "• api/database/seeders/*.php\n";
                echo "• Populates database with default data\n";
                break;

            case '--migrate:seed':
                echo "Command: --migrate:seed\n";
                echo "Purpose: Run migrations then seeders\n\n";
                echo "What it does:\n";
                echo "• Runs all migrations first\n";
                echo "• Then runs all seeders\n";
                echo "• Complete database setup in one step\n\n";
                echo "Usage:\n";
                echo "  php api/index.php --migrate:seed\n\n";
                echo "Equivalent to:\n";
                echo "  php api/index.php --migrate && php api/index.php --seed\n";
                break;

            case '--clear':
                echo "Command: --clear\n";
                echo "Purpose: Clear all database tables\n\n";
                echo "⚠️  WARNING: This command is DANGEROUS!\n";
                echo "• Drops all existing tables\n";
                echo "• Removes all data permanently\n";
                echo "• Cannot be undone\n\n";
                echo "Usage:\n";
                echo "  php api/index.php --clear\n\n";
                echo "Use with extreme caution!\n";
                break;

            case '--fresh':
                echo "Command: --fresh\n";
                echo "Purpose: Complete fresh database setup\n\n";
                echo "What it does:\n";
                echo "1. Clears all existing tables\n";
                echo "2. Runs all migrations\n";
                echo "3. Runs all seeders\n";
                echo "4. Creates a completely fresh database\n\n";
                echo "Usage:\n";
                echo "  php api/index.php --fresh\n\n";
                echo "Recommended for new installations!\n";
                break;

            case '--email':
                echo "Command: --email:user@example.com\n";
                echo "Purpose: Test email functionality\n\n";
                echo "What it does:\n";
                echo "• Sends a test email to the specified address\n";
                echo "• Validates email configuration\n";
                echo "• Useful for testing email settings\n\n";
                echo "Usage:\n";
                echo "  php api/index.php --email:test@gmail.com\n\n";
                echo "Make sure email is configured in:\n";
                echo "• api/core/Emailer.php\n";
                break;

            case '--db:check':
                echo "Command: --db:check\n";
                echo "Purpose: Test database connection\n\n";
                echo "What it does:\n";
                echo "• Attempts to connect to the database and run a simple query\n";
                echo "• Prints a success or error message\n\n";
                echo "Usage:\n";
                echo "  php api/index.php --db:check\n\n";
                echo "If successful, you'll see a success message.\n";
                break;

            default:
                echo "❌ Unknown command: $command\n";
                echo "Use 'php api/index.php --help' for available commands.\n";
        }
    }

    public static function showError($message, $command = null)
    {
        echo "\n❌ Error: $message\n";
        
        if ($command) {
            echo "\nFor help with this command:\n";
            echo "  php api/index.php --help $command\n";
        } else {
            echo "\nFor general help:\n";
            echo "  php api/index.php --help\n";
        }
    }

    public static function showSuccess($message)
    {
        echo "\n✅ $message\n";
    }

    public static function showWarning($message)
    {
        echo "\n⚠️  Warning: $message\n";
    }
} 