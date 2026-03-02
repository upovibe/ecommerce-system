<div style="font-family: Arial, sans-serif; color: #222;">
    <h2>New Application Submitted</h2>
    <p>A new application has been submitted to <strong><?= htmlspecialchars($schoolName) ?></strong>:</p>
    <ul>
        <li><strong>Applicant Name:</strong> <?= htmlspecialchars($applicantName) ?></li>
        <li><strong>Application Number:</strong> <?= htmlspecialchars($applicantNumber) ?></li>
        <li><strong>Grade:</strong> <?= htmlspecialchars($grade) ?></li>
        <li><strong>Email:</strong> <?= htmlspecialchars($applicantEmail) ?></li>
        <li><strong>Parent Phone:</strong> <?= htmlspecialchars($parentPhone) ?></li>
    </ul>
    <p>Please log in to the admin dashboard to review this application.</p>
    <p>Best regards,<br>The Admissions System</p>
</div> 