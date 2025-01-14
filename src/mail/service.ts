import * as nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      pool: true,
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_ID,
        pass: process.env.GMAIL_PW,
      },
    });
    console.log('Transporter initialized');
  }
  return transporter;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const mailOptions = { from: 'hywepautomation@gmail.com', to, subject, html };
  const transporter = getTransporter();
  await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${to}`);
}

export async function sendNewRecruitmentEmail(
  userEmail: string,
  userName: string,
  recruits: any[],
): Promise<void> {
  if (recruits.length === 0) {
    console.log(`No matching recruits found for ${userName}.`);
    return;
  }
  const recruitDetailsHtml = generateRecruitDetails(recruits);
  const fullHtml = generateEmailContent(userName, recruitDetailsHtml);
  await sendEmail(
    userEmail,
    `${process.env.NODE_ENV !== 'prod' ? `[${process.env.NODE_ENV}] ` : ''}[한양대학교 현장실습] 진행 중인 공고를 확인해보세요`,
    fullHtml,
  );
}

export async function sendRecruitmentByTagEmail(
  userEmail: string,
  userName: string,
  recruits: any[],
): Promise<void> {
  if (recruits.length === 0) {
    console.log(`No matching recruits found for ${userName}.`);
    return;
  }
  const fullHtml = generateFullRecruitmentEmail(userName, recruits);
  await sendEmail(
    userEmail,
    `${process.env.NODE_ENV !== 'prod' ? `[${process.env.NODE_ENV}] ` : ''}[한양대학교 현장실습] 관심 키워드에 맞는 공고를 확인해보세요`,
    fullHtml,
  );
}

export function generateRecruitByTagDetails(recruits: any[]): string {
  return recruits
    .map((recruit) => {
      const {
        organizationName,
        location,
        applicationDeadline,
        department,
        startDate,
        endDate,
        type,
        recruitCount,
        organizationSize,
        qualifications,
        interviewInfo,
        internshipDetails,
        announcedMajors,
        organizationSupportAmount,
      } = recruit;

      return generateInternshipDetailEmailHTML(
        organizationName,
        location,
        applicationDeadline,
        department,
        startDate,
        endDate,
        type,
        recruitCount,
        organizationSize,
        qualifications,
        interviewInfo,
        internshipDetails,
        announcedMajors,
        organizationSupportAmount,
      );
    })
    .join('<hr style="border: 1px solid #ddd; margin: 20px 0;">');
}

function generateRecruitDetails(recruits: any[]): string {
  return recruits
    .map((recruit, index) => {
      const {
        organizationName,
        organizationSize,
        location,
        applicationDeadline,
        department,
        internshipDetails,
        qualifications,
        organizationSupportAmount,
        recruitCount,
      } = recruit;

      const borderStyle =
        index !== recruits.length - 1 ? 'border-bottom: 1px solid #ddd;' : '';

      // Generate HTML snippets for each field
      const organizationSizeHtml =
        organizationSize === '대기업'
          ? `<li style="margin-bottom: 10px;"><strong style="color: #0056b3;">조직 규모:</strong> <span style="color: red; font-weight: bold;">${organizationSize}</span></li>`
          : '';

      const organizationNameHtml = organizationName
        ? `<li style="margin-bottom: 10px;"><strong style="color: #0056b3;">기관 이름:</strong> <span style="color: #000;">${organizationName}</span></li>`
        : '';

      const departmentHtml = department
        ? `<li style="margin-bottom: 10px;"><strong style="color: #0056b3;">부서:</strong> <span style="color: #000;">${department}</span></li>`
        : '';

      const jobTitleHtml = internshipDetails?.jobTitle
        ? `<li style="margin-bottom: 10px;"><strong style="color: #0056b3;">직무명:</strong> <span style="color: #000;">${internshipDetails.jobTitle}</span></li>`
        : '';

      const qualificationsHtml = qualifications?.major
        ? `<li style="margin-bottom: 10px;"><strong style="color: #0056b3;">전공:</strong> <span style="color: #000;">${qualifications.major.join(
            ', ',
          )}</span></li>`
        : '';

      const locationHtml = location
        ? `<li style="margin-bottom: 10px;"><strong style="color: #0056b3;">위치:</strong> <span style="color: #000;">${location}</span></li>`
        : '';

      const organizationSupportAmountHtml =
        organizationSupportAmount?.period &&
        organizationSupportAmount?.amount &&
        organizationSupportAmount.amount !== 0
          ? `<li style="margin-bottom: 10px;"><strong style="color: #0056b3;">급여:</strong> <span style="color: #000;">${organizationSupportAmount.period} ${organizationSupportAmount.amount.toLocaleString()}</span></li>`
          : '';

      const recruitCountHtml = recruitCount
        ? `<li style="margin-bottom: 10px;"><strong style="color: #0056b3;">모집 인원:</strong> <span style="color: #000;">${recruitCount}</span></li>`
        : '';

      const applicationDeadlineHtml = applicationDeadline
        ? `<li><strong style="color: #0056b3;">지원 마감일:</strong> <span style="color: #000;">${applicationDeadline}</span></li>`
        : '';

      return `
        <div style="margin: 20px 0; padding-bottom: 20px; ${borderStyle}">
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${organizationSizeHtml}
            ${organizationNameHtml}
            ${departmentHtml}
            ${jobTitleHtml}
            ${qualificationsHtml}
            ${locationHtml}
            ${recruitCountHtml}
            ${organizationSupportAmountHtml}
            ${applicationDeadlineHtml}
          </ul>
        </div>
      `;
    })
    .join('');
}

function generateEmailContent(
  userName: string,
  recruitDetails: string,
): string {
  return `
  <!DOCTYPE html>
  <html>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; color: #000;">
    <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); overflow: hidden;">
      <div style="background-color: #0056b3; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">한양대학교 현장실습 공고</h1>
      </div>
      <div style="padding: 20px;">
        <p style="color: #000;">안녕하세요 <strong style="color: #0056b3;">${userName}</strong>님,</p>
        <p style="margin-bottom: 20px; color: #000;">소속 학과와 학년에 적합한 진행중인 공고입니다:</p>
        <div style="margin-top: 10px;">
          ${recruitDetails}
        </div>
        <div style="margin-top: 20px; text-align: center;">
          <a href="https://hywep.hanyang.ac.kr/index.do" style="display: inline-block; padding: 10px 20px; color: #0056b3; text-decoration: none; font-weight: bold; border: 1px solid #0056b3; border-radius: 5px;">
            지원하기
          </a>
        </div>
      </div>
      <div style="text-align: center; padding: 15px; background-color: #f9f9f9; font-size: 12px; color: #555;">
        <p>컴퓨터소프트웨어학부</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

export function generateInternshipEmailHTML(
  userName,
  organizationName,
  location,
  applicationDeadline,
  department,
  startDate,
  endDate,
  type,
  recruitCount,
  organizationSize,
  qualifications,
  interviewInfo,
  internshipDetails,
  announcedMajors,
  organizationSupportAmount,
) {
  const organizationSizeHtml =
    organizationSize === '대기업'
      ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">조직 규모:</strong> <span style="color: red; font-weight: bold;">${organizationSize}</span></li>`
      : '';

  const departmentHtml = department
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">부서:</strong> <span style="color: #000;">${department}</span></li>`
    : '';

  const jobTitleHtml = internshipDetails?.jobTitle
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">직무명:</strong> <span style="color: #000;">${internshipDetails.jobTitle}</span></li>`
    : '';

  const typeHtml = type
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">유형:</strong> <span style="color: #000;">${type}</span></li>`
    : '';

  const recruitCountHtml = recruitCount
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">모집 인원:</strong> <span style="color: #000;">${recruitCount}</span></li>`
    : '';

  const endDateHtml = endDate
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">종료일:</strong> <span style="color: #000;">${endDate}</span></li>`
    : '';

  const applicationDeadlineHtml = applicationDeadline
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">지원 마감일:</strong> <span style="color: #000;">${applicationDeadline}</span></li>`
    : '';

  const startDateHtml = startDate
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">시작일:</strong> <span style="color: #000;">${startDate}</span></li>`
    : '';

  const locationHtml = location
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">위치:</strong> <span style="color: #000;">${location}</span></li>`
    : '';

  const organizationNameHtml = organizationName
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">기관 이름:</strong> <span style="color: #000;">${organizationName}</span></li>`
    : '';

  const organizationSupportAmountHtml =
    organizationSupportAmount &&
    organizationSupportAmount.period &&
    organizationSupportAmount.amount &&
    organizationSupportAmount.amount !== 0
      ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">급여:</strong> <span style="color: #000;">${organizationSupportAmount.period} ${organizationSupportAmount.amount.toLocaleString()}</span></li>`
      : '';

  const qualificationsHtml = qualifications
    ? `<ul style="list-style: none; padding: 0; margin: 0;">
        ${
          announcedMajors
            ? announcedMajors.includes('자격')
              ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">전공:</strong> <span style="color: #000;">${qualifications.major.join(', ')}</span></li>`
              : `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">전공:</strong> <span style="color: #000;">${announcedMajors}</span></li>`
            : `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">전공:</strong> <span style="color: #000;">${qualifications.major.join(', ')}</span></li>`
        }
        ${
          qualifications.grade
            ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">학년:</strong> <span style="color: #000;">${qualifications.grade}</span></li>`
            : ''
        }
        ${
          qualifications.etc
            ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">기타:</strong> <span style="color: #000;">${qualifications.etc}</span></li>`
            : ''
        }
      </ul>`
    : '';

  const interviewDetailsHtml = interviewInfo
    ? `<ul style="list-style: none; padding: 0; margin: 0;">
        ${
          interviewInfo.interviewType
            ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">면접 유형:</strong> <span style="color: #000;">${interviewInfo.interviewType}</span></li>`
            : ''
        }
        ${
          interviewInfo.applicationSubmissionPeriod
            ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">지원서 제출 기간:</strong> <span style="color: #000;">${interviewInfo.applicationSubmissionPeriod}</span></li>`
            : ''
        }
        ${
          interviewInfo.applicationResultsAnnouncement
            ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">면접 전형:</strong> <span style="color: #000;">${interviewInfo.applicationResultsAnnouncement}</span></li>`
            : ''
        }
        ${
          interviewInfo.finalResultsAnnouncement
            ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">최종 발표:</strong> <span style="color: #000;">${interviewInfo.finalResultsAnnouncement}</span></li>`
            : ''
        }
      </ul>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; color: #000;">
      <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="background-color: #0056b3; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">한양대학교 현장실습 공고</h1>
        </div>
        <div style="padding: 20px;">
          <p style="color: black">안녕하세요 <strong>${userName || '학생'}</strong>님,</p>
          <p style="color: black">소속 학과와 학년에 적합한 새로운 공고가 추가되었습니다:</p>
          <ul style="list-style: none; padding: 0; margin-top: 20px;">
            ${organizationSizeHtml}
            ${organizationNameHtml}
            ${departmentHtml}
            ${jobTitleHtml}
            ${locationHtml}
            ${typeHtml}
            ${recruitCountHtml}
            ${organizationSupportAmountHtml}
            ${applicationDeadlineHtml}
            ${startDateHtml}
            ${endDateHtml}
          </ul>
          <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd;">
            ${qualificationsHtml ? `<h3 style="color: #0056b3;">자격 요건</h3>${qualificationsHtml}` : ''}
            ${interviewDetailsHtml ? `<h3 style="color: #0056b3;">면접 정보</h3>${interviewDetailsHtml}` : ''}
          </div>
          <div style="margin-top: 20px; text-align: center;">
            <a href="https://hywep.hanyang.ac.kr/index.do" style="display: inline-block; padding: 10px 20px; color: #0056b3; text-decoration: none; font-weight: bold; border: 1px solid #0056b3; border-radius: 5px;">
              지원하기
            </a>
          </div>
        </div>
        <div style="text-align: center; padding: 15px; background-color: #f9f9f9; font-size: 12px; color: #555;">
          <p>컴퓨터소프트웨어학부</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateInternshipDetailEmailHTML(
  organizationName,
  location,
  applicationDeadline,
  department,
  startDate,
  endDate,
  type,
  recruitCount,
  organizationSize,
  qualifications,
  interviewInfo,
  internshipDetails,
  announcedMajors,
  organizationSupportAmount,
) {
  const organizationSizeHtml =
    organizationSize === '대기업'
      ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">조직 규모:</strong> <span style="color: red; font-weight: bold;">${organizationSize}</span></li>`
      : '';

  const departmentHtml = department
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">부서:</strong> <span style="color: #000;">${department}</span></li>`
    : '';

  const jobTitleHtml = internshipDetails?.jobTitle
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">직무명:</strong> <span style="color: #000;">${internshipDetails.jobTitle}</span></li>`
    : '';

  const typeHtml = type
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">유형:</strong> <span style="color: #000;">${type}</span></li>`
    : '';

  const recruitCountHtml = recruitCount
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">모집 인원:</strong> <span style="color: #000;">${recruitCount}</span></li>`
    : '';

  const endDateHtml = endDate
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">종료일:</strong> <span style="color: #000;">${endDate}</span></li>`
    : '';

  const applicationDeadlineHtml = applicationDeadline
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">지원 마감일:</strong> <span style="color: #000;">${applicationDeadline}</span></li>`
    : '';

  const startDateHtml = startDate
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">시작일:</strong> <span style="color: #000;">${startDate}</span></li>`
    : '';

  const locationHtml = location
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">위치:</strong> <span style="color: #000;">${location}</span></li>`
    : '';

  const organizationNameHtml = organizationName
    ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">기관 이름:</strong> <span style="color: #000;">${organizationName}</span></li>`
    : '';

  const organizationSupportAmountHtml =
    organizationSupportAmount &&
    organizationSupportAmount.period &&
    organizationSupportAmount.amount &&
    organizationSupportAmount.amount !== 0
      ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">급여:</strong> <span style="color: #000;">${organizationSupportAmount.period} ${organizationSupportAmount.amount.toLocaleString()}</span></li>`
      : '';

  const qualificationsHtml = qualifications
    ? `<ul style="list-style: none; padding: 0; margin: 0;">
        ${
          announcedMajors
            ? announcedMajors.includes('자격')
              ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">전공:</strong> <span style="color: #000;">${qualifications.major.join(', ')}</span></li>`
              : `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">전공:</strong> <span style="color: #000;">${announcedMajors}</span></li>`
            : `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">전공:</strong> <span style="color: #000;">${qualifications.major.join(', ')}</span></li>`
        }
        ${
          qualifications.grade
            ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">학년:</strong> <span style="color: #000;">${qualifications.grade}</span></li>`
            : ''
        }
        ${
          qualifications.etc
            ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">기타:</strong> <span style="color: #000;">${qualifications.etc}</span></li>`
            : ''
        }
      </ul>`
    : '';

  const interviewDetailsHtml = interviewInfo
    ? `<ul style="list-style: none; padding: 0; margin: 0;">
        ${
          interviewInfo.interviewType
            ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">면접 유형:</strong> <span style="color: #000;">${interviewInfo.interviewType}</span></li>`
            : ''
        }
        ${
          interviewInfo.applicationSubmissionPeriod
            ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">지원서 제출 기간:</strong> <span style="color: #000;">${interviewInfo.applicationSubmissionPeriod}</span></li>`
            : ''
        }
        ${
          interviewInfo.applicationResultsAnnouncement
            ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">면접 전형:</strong> <span style="color: #000;">${interviewInfo.applicationResultsAnnouncement}</span></li>`
            : ''
        }
        ${
          interviewInfo.finalResultsAnnouncement
            ? `<li style="margin-bottom: 10px"><strong style="color: #0056b3;">최종 발표:</strong> <span style="color: #000;">${interviewInfo.finalResultsAnnouncement}</span></li>`
            : ''
        }
      </ul>`
    : '';

  return `
          <ul style="list-style: none; padding: 0; margin-top: 20px;">
            ${organizationSizeHtml}
            ${organizationNameHtml}
            ${departmentHtml}
            ${jobTitleHtml}
            ${locationHtml}
            ${typeHtml}
            ${recruitCountHtml}
            ${organizationSupportAmountHtml}
            ${applicationDeadlineHtml}
            ${startDateHtml}
            ${endDateHtml}
          </ul>
          <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd;">
            ${qualificationsHtml ? `<h3 style="color: #0056b3;">자격 요건</h3>${qualificationsHtml}` : ''}
            ${interviewDetailsHtml ? `<h3 style="color: #0056b3;">면접 정보</h3>${interviewDetailsHtml}` : ''}
          </div>
         `;
}

function generateEmailTemplate(userName: string, bodyContent: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; color: #000;">
      <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="background-color: #0056b3; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">한양대학교 현장실습 공고</h1>
        </div>
        <div style="padding: 20px;">
          <p style="color: #000;">안녕하세요 <strong style="color: #0056b3;">${userName}</strong>님,</p>
          <p style="margin-bottom: 20px; color: #000;">관심 키워드에 맞는 진행중인 공고입니다:</p>
          <div style="margin-top: 10px;">
            ${bodyContent}
          </div>
          <div style="margin-top: 20px; text-align: center;">
            <a href="https://hywep.hanyang.ac.kr/index.do" style="display: inline-block; padding: 10px 20px; color: #0056b3; text-decoration: none; font-weight: bold; border: 1px solid #0056b3; border-radius: 5px;">
              지원하기
            </a>
          </div>
        </div>
        <div style="text-align: center; padding: 15px; background-color: #f9f9f9; font-size: 12px; color: #555;">
          <p>컴퓨터소프트웨어학부</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateFullRecruitmentEmail(
  userName: string,
  recruits: any[],
): string {
  const recruitDetailsHtml = generateRecruitByTagDetails(recruits);
  return generateEmailTemplate(userName, recruitDetailsHtml);
}
