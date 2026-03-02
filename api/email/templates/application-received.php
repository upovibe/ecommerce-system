<div style="font-family: Arial, sans-serif; color: #222;">
    <h2>Thank you for your application, <?= htmlspecialchars($applicantName) ?>!</h2>
    <p>We have received your application to <strong><?= htmlspecialchars($schoolName) ?></strong>.</p>
    <p><strong>Application Number:</strong> <?= htmlspecialchars($applicantNumber) ?><br>
       <strong>Grade Applied For:</strong> <?= htmlspecialchars($grade) ?></p>
    <p>Please keep your application number for your records. Our admissions team will review your application and contact you if any further information is needed.</p>
    <p>Best regards,<br>The Admissions Team<br><?= htmlspecialchars($schoolName) ?></p>
</div> 